/**
  ******************************************************************************
  * @file    tds_sensor.c
  * @brief   TDS sensor functions implementation - Complete Working Version
  * @note    Compatible with TDS sensor module on PB3 pin (ADC_CHANNEL_2)
  ******************************************************************************
  */

/* Includes ------------------------------------------------------------------*/
#include "tds_sensor.h"
#include <stdbool.h>

/* Private typedef -----------------------------------------------------------*/
/* Private define ------------------------------------------------------------*/
/* Private macro -------------------------------------------------------------*/
/* Private variables ---------------------------------------------------------*/
static TDS_CalibrationTypeDef tdsCalibration = {
    .kValue = TDS_DEFAULT_K_VALUE,
    .offsetVoltage = TDS_DEFAULT_OFFSET,
    .isCalibrated = 0
};

// Shared ADC reading variables (global for use by both TDS and pH sensors)
uint16_t g_adcChannelValues[4] = {0};
uint32_t g_lastAdcReadTime = 0;

/* External variables --------------------------------------------------------*/
extern ADC_HandleTypeDef hadc;

/* Private function prototypes -----------------------------------------------*/
static const char* TDS_ClassifyWaterQuality(float tdsValue);

/* Shared function prototypes ------------------------------------------------*/
HAL_StatusTypeDef ADC_ReadAllChannels(void);
uint16_t ADC_GetChannelValue(uint8_t rank);
HAL_StatusTypeDef ADC_ForceRefresh(void);

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Read all ADC channels and store in global array (Simple Robust Version)
 * @retval HAL status
 */
HAL_StatusTypeDef ADC_ReadAllChannels(void)
{
    uint32_t currentTime = HAL_GetTick();

    // Only read if it's been more than 50ms since last read (avoid excessive reading)
    if (currentTime - g_lastAdcReadTime < 50) {
        return HAL_OK; // Use cached values
    }

    // Always stop ADC first to ensure clean state
    HAL_ADC_Stop(&hadc);
    HAL_Delay(10); // Give ADC time to stop completely

    // Clear old values first
    for (int j = 0; j < 4; j++) {
        g_adcChannelValues[j] = 0;
    }

    // Start ADC with error checking
    HAL_StatusTypeDef status = HAL_ADC_Start(&hadc);
    if (status != HAL_OK) {
        return HAL_ERROR;
    }

    // Read all 4 channels in sequence
    uint8_t readSuccess = 1;
    for (int i = 0; i < 4; i++) {
        status = HAL_ADC_PollForConversion(&hadc, 300); // Increased timeout
        if (status == HAL_OK) {
            g_adcChannelValues[i] = HAL_ADC_GetValue(&hadc);
        } else {
            // Mark as failed but continue to try other channels
            readSuccess = 0;
            g_adcChannelValues[i] = 0;
        }
    }

    // Always stop ADC
    HAL_ADC_Stop(&hadc);

    // Update timestamp only if we attempted a read
    g_lastAdcReadTime = currentTime;

    return readSuccess ? HAL_OK : HAL_ERROR;
}

/**
 * @brief Get ADC value for specific channel rank
 * @param rank: Channel rank (0-3)
 * @retval ADC value (0 if invalid rank or error)
 */
uint16_t ADC_GetChannelValue(uint8_t rank)
{
    if (rank >= 4) return 0;

    // Ensure we have fresh readings
    ADC_ReadAllChannels();

    return g_adcChannelValues[rank];
}

/**
 * @brief Force refresh of ADC readings (Simple version)
 * @retval HAL status
 */
HAL_StatusTypeDef ADC_ForceRefresh(void)
{
    // Ensure ADC is stopped first
    HAL_ADC_Stop(&hadc);
    HAL_Delay(5); // Small delay to ensure ADC is fully stopped

    // Reset timestamp to force fresh read
    g_lastAdcReadTime = 0;

    // Clear cached values
    for (int i = 0; i < 4; i++) {
        g_adcChannelValues[i] = 0;
    }

    // Perform fresh ADC reading
    return ADC_ReadAllChannels();
}

/**
 * @brief Classify water quality based on TDS value (WHO Standards)
 * @param tdsValue: TDS value in ppm
 * @retval Pointer to water quality classification string
 */
static const char* TDS_ClassifyWaterQuality(float tdsValue)
{
    if (tdsValue <= 300.0f)        // TDS_EXCELLENT_MAX
    {
        return "Excellent";
    }
    else if (tdsValue <= 600.0f)   // TDS_GOOD_MAX
    {
        return "Good";
    }
    else if (tdsValue <= 900.0f)   // TDS_FAIR_MAX
    {
        return "Fair";
    }
    else if (tdsValue <= 1200.0f)  // TDS_POOR_MAX
    {
        return "Poor";
    }
    else if (tdsValue <= 2000.0f)  // TDS_UNACCEPTABLE_MAX
    {
        return "Unacceptable";
    }
    else
    {
        return "Dangerous";
    }
}

/* Public functions ----------------------------------------------------------*/

/**
 * @brief Initialize TDS sensor
 * @retval HAL status
 */
HAL_StatusTypeDef TDS_Init(void)
{
    // Reset calibration to default values
    TDS_ResetCalibration();

    // Initialize ADC channel values
    for (int i = 0; i < 4; i++) {
        g_adcChannelValues[i] = 0;
    }
    g_lastAdcReadTime = 0;

    // ADC should already be initialized by CubeMX
    // Just verify it's ready
    if (HAL_ADC_GetState(&hadc) == HAL_ADC_STATE_RESET)
    {
        return HAL_ERROR;
    }

    return HAL_OK;
}

/**
 * @brief Read TDS sensor raw ADC value (reads from rank 0 = ADC_CHANNEL_2/PB3)
 * @retval Raw ADC value (0-4095)
 */
uint16_t TDS_ReadRawADC(void)
{
    // Read all ADC channels
    if (ADC_ReadAllChannels() != HAL_OK) {
        return 0; // Return 0 on error
    }

    // Return TDS channel value (rank 0 = ADC_CHANNEL_2/PB3)
    return g_adcChannelValues[TDS_ADC_CHANNEL_RANK];
}

/**
 * @brief Convert ADC value to voltage
 * @param adcValue: Raw ADC value
 * @retval Voltage in mV
 */
float TDS_ADCToVoltage(uint16_t adcValue)
{
    return ((float)adcValue * TDS_SENSOR_VREF) / TDS_SENSOR_ADC_RESOLUTION;
}

/**
 * @brief Convert voltage to conductivity with temperature compensation
 * @param voltage: Voltage in mV
 * @param temperature: Temperature in °C for compensation
 * @retval Conductivity in uS/cm
 */
float TDS_VoltageToconductivity(float voltage, float temperature)
{
    // Apply voltage offset calibration
    float compensatedVoltage = voltage - tdsCalibration.offsetVoltage;

    // Convert voltage to conductivity (empirical formula for TDS sensors)
    // Typical TDS sensor: 0V = 0 uS/cm, 3.3V = ~2000 uS/cm
    float conductivity = (compensatedVoltage / TDS_SENSOR_VREF) * 2000.0f * tdsCalibration.kValue;

    // Apply temperature compensation
    conductivity = TDS_ApplyTemperatureCompensation(conductivity, temperature);

    // Ensure conductivity is within valid range
    if (conductivity < 0.0f) conductivity = 0.0f;
    if (conductivity > 3000.0f) conductivity = 3000.0f;

    return conductivity;
}

/**
 * @brief Convert conductivity to TDS value
 * @param conductivity: Conductivity in uS/cm
 * @retval TDS value in ppm
 */
float TDS_ConductivityToTDS(float conductivity)
{
    // Standard conversion: TDS (ppm) ≈ Conductivity (uS/cm) × 0.5
    // This factor can vary between 0.4-0.8 depending on water composition
    float tdsValue = conductivity * 0.5f;

    // Constrain to valid TDS range
    if (tdsValue < TDS_MIN_VALUE) tdsValue = TDS_MIN_VALUE;
    if (tdsValue > TDS_MAX_VALUE) tdsValue = TDS_MAX_VALUE;

    return tdsValue;
}

/**
 * @brief Apply temperature compensation to conductivity
 * @param conductivity: Raw conductivity value
 * @param temperature: Current temperature in °C
 * @retval Temperature compensated conductivity
 */
float TDS_ApplyTemperatureCompensation(float conductivity, float temperature)
{
    // Temperature compensation: conductivity increases ~2% per °C
    float tempDiff = temperature - TDS_REFERENCE_TEMP;
    float compensationFactor = 1.0f + (TDS_TEMP_COEFFICIENT * tempDiff);

    return conductivity / compensationFactor;
}

/**
 * @brief Enhanced sensor connection detection
 * @param reading: TDS reading structure
 * @retval 1 if sensor is connected, 0 if disconnected
 */
uint8_t TDS_IsSensorConnected(TDS_ReadingTypeDef reading)
{
    // Check for ADC value of 0 (error condition)
    if (reading.adcValue == 0) {
        return 0; // Disconnected or error
    }

    // Check for typical disconnected sensor patterns
    // ADC value in typical floating range (1200-2400) indicates disconnected sensor
    if (reading.adcValue >= TDS_FLOATING_ADC_MIN && reading.adcValue <= TDS_FLOATING_ADC_MAX) {
        return 0;  // Disconnected - floating input
    }

    // Very low readings (near 0V) indicate connected sensor in clean water
    if (reading.adcValue <= TDS_CLEAN_WATER_ADC_MAX) {
        return 1;  // Connected - clean water
    }

    // Higher readings (above 2500) indicate connected sensor in conductive water
    if (reading.adcValue >= TDS_CONDUCTIVE_WATER_ADC_MIN) {
        return 1;  // Connected - conductive water
    }

    // ADC values between clean water and floating range (800-1200)
    // This could be moderate TDS water - assume connected
    if (reading.adcValue > TDS_CLEAN_WATER_ADC_MAX && reading.adcValue < TDS_FLOATING_ADC_MIN) {
        return 1;  // Connected - moderate TDS water
    }

    // Default case - assume disconnected for safety
    return 0;
}

/**
 * @brief Read TDS sensor with temperature compensation
 * @param temperature: Current temperature in °C
 * @retval TDS_ReadingTypeDef structure with all measurements
 */
TDS_ReadingTypeDef TDS_ReadSensor(float temperature)
{
    TDS_ReadingTypeDef reading = {0};

    // Read raw ADC value
    reading.adcValue = TDS_ReadRawADC();

    // Convert to voltage
    reading.voltage = TDS_ADCToVoltage(reading.adcValue);

    // Store temperature
    reading.temperature = temperature;

    // Enhanced sensor connection check
    if (TDS_IsSensorConnected(reading))
    {
        reading.isValid = 1;

        // Calculate conductivity with temperature compensation
        reading.conductivity = TDS_VoltageToconductivity(reading.voltage, temperature);

        // Convert conductivity to TDS
        reading.tdsValue = TDS_ConductivityToTDS(reading.conductivity);

        // Get water quality classification
        reading.waterQuality = TDS_ClassifyWaterQuality(reading.tdsValue);
    }
    else
    {
        reading.isValid = 0;
        reading.conductivity = 0.0f;
        reading.tdsValue = 0.0f;
        reading.waterQuality = "No Sensor";
    }

    return reading;
}

/**
 * @brief Read TDS sensor with default temperature (25°C)
 * @retval TDS_ReadingTypeDef structure
 */
TDS_ReadingTypeDef TDS_ReadSensorDefault(void)
{
    return TDS_ReadSensor(TDS_REFERENCE_TEMP);
}

/**
 * @brief Get just the TDS value
 * @retval TDS value in ppm
 */
float TDS_GetValue(void)
{
    TDS_ReadingTypeDef reading = TDS_ReadSensorDefault();
    return reading.tdsValue;
}

/**
 * @brief Get water quality classification string
 * @param tdsValue: TDS value in ppm
 * @retval Pointer to water quality string
 */
const char* TDS_GetWaterQualityString(float tdsValue)
{
    return TDS_ClassifyWaterQuality(tdsValue);
}

/**
 * @brief Calibrate TDS sensor with known solution
 * @param knownTDS: Known TDS value of calibration solution in ppm
 * @param measuredVoltage: Measured voltage in mV
 * @retval HAL status
 */
HAL_StatusTypeDef TDS_Calibrate(float knownTDS, float measuredVoltage)
{
    if (knownTDS <= 0.0f || measuredVoltage <= 0.0f ||
        knownTDS > TDS_MAX_VALUE || measuredVoltage > TDS_SENSOR_VREF)
    {
        return HAL_ERROR;
    }

    // Calculate calibration constant
    // Expected conductivity for known TDS
    float expectedConductivity = knownTDS / 0.5f;  // Reverse of TDS = conductivity * 0.5

    // Expected voltage for this conductivity
    float expectedVoltage = (expectedConductivity / 2000.0f) * TDS_SENSOR_VREF;

    // Calculate K value
    tdsCalibration.kValue = expectedVoltage / measuredVoltage;
    tdsCalibration.isCalibrated = 1;

    return HAL_OK;
}

/**
 * @brief Reset calibration to default values
 * @retval HAL status
 */
HAL_StatusTypeDef TDS_ResetCalibration(void)
{
    tdsCalibration.kValue = TDS_DEFAULT_K_VALUE;
    tdsCalibration.offsetVoltage = TDS_DEFAULT_OFFSET;
    tdsCalibration.isCalibrated = 0;

    return HAL_OK;
}

/**
 * @brief Get current calibration data
 * @retval TDS_CalibrationTypeDef structure
 */
TDS_CalibrationTypeDef TDS_GetCalibration(void)
{
    return tdsCalibration;
}

/**
 * @brief Check if TDS reading is valid
 * @param reading: TDS reading structure
 * @retval 1 if valid, 0 if invalid
 */
uint8_t TDS_IsReadingValid(TDS_ReadingTypeDef reading)
{
    return reading.isValid && IS_TDS_VALUE_VALID(reading.tdsValue);
}
