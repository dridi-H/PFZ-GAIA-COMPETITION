/**
  ******************************************************************************
  * @file    ph_sensor.c
  * @brief   pH sensor functions implementation - Complete Working Version
  * @note    Compatible with DFRobot SEN0161 pH sensor on PB1 pin
  ******************************************************************************
  */

/* Includes ------------------------------------------------------------------*/
#include "ph_sensor.h"

/* Private typedef -----------------------------------------------------------*/
/* Private define ------------------------------------------------------------*/
/* Private macro -------------------------------------------------------------*/
/* Private variables ---------------------------------------------------------*/
static pH_CalibrationTypeDef phCalibration = {
    .neutralVoltage = PH_DEFAULT_NEUTRAL_VOLTAGE,
    .acidVoltage = 0.0f,
    .slope = PH_DEFAULT_SLOPE,
    .isCalibrated = 0
};

// External shared ADC variables (declared in tds_sensor.c)
extern uint16_t g_adcChannelValues[4];
extern uint32_t g_lastAdcReadTime;

/* External variables --------------------------------------------------------*/
extern ADC_HandleTypeDef hadc;

/* External shared functions (declared in tds_sensor.c) ----------------------*/
extern HAL_StatusTypeDef ADC_ReadAllChannels(void);
extern uint16_t ADC_GetChannelValue(uint8_t rank);

/* Private function prototypes -----------------------------------------------*/
static float pH_CalculateSlope(float voltage4, float voltage7);
static float pH_ApplyTemperatureCompensation(float phValue, float temperature);

/* Private functions ---------------------------------------------------------*/

/**
 * @brief Calculate slope from two-point calibration
 * @param voltage4: Voltage at pH 4.0
 * @param voltage7: Voltage at pH 7.0
 * @retval Calculated slope in mV/pH
 */
static float pH_CalculateSlope(float voltage4, float voltage7)
{
    // Slope = (V4 - V7) / (pH4 - pH7) = (V4 - V7) / (4.0 - 7.0)
    return (voltage4 - voltage7) / (PH_ACID_VALUE - PH_NEUTRAL_VALUE);
}

/**
 * @brief Apply temperature compensation to pH reading
 * @param phValue: pH value at current temperature
 * @param temperature: Current temperature in °C
 * @retval Temperature compensated pH value
 */
static float pH_ApplyTemperatureCompensation(float phValue, float temperature)
{
    float tempDiff = temperature - PH_REFERENCE_TEMP;
    float compensation = (PH_NEUTRAL_VALUE - phValue) * PH_TEMP_COEFFICIENT * tempDiff;
    return phValue + compensation;
}

/* Public functions ----------------------------------------------------------*/

/**
 * @brief Initialize pH sensor
 * @retval HAL status
 */
HAL_StatusTypeDef pH_Init(void)
{
    // Reset calibration to default values
    pH_ResetCalibration();

    // ADC should already be initialized by CubeMX
    // Just verify it's ready
    if (HAL_ADC_GetState(&hadc) == HAL_ADC_STATE_RESET)
    {
        return HAL_ERROR;
    }

    return HAL_OK;
}

/**
 * @brief Read pH sensor raw ADC value (reads from rank 2 = ADC_CHANNEL_5/PB1)
 * @retval Raw ADC value (0-4095)
 */
uint16_t pH_ReadRawADC(void)
{
    // Read all ADC channels using shared function
    if (ADC_ReadAllChannels() != HAL_OK) {
        return 0; // Return 0 on error
    }

    // Return pH channel value (rank 2 = ADC_CHANNEL_5/PB1)
    return g_adcChannelValues[PH_ADC_CHANNEL_RANK];
}

/**
 * @brief Convert ADC value to voltage
 * @param adcValue: Raw ADC value
 * @retval Voltage in mV
 */
float pH_ADCToVoltage(uint16_t adcValue)
{
    return ((float)adcValue * PH_SENSOR_VREF) / PH_SENSOR_ADC_RESOLUTION;
}

/**
 * @brief Read pH sensor with temperature compensation
 * @param temperature: Current temperature in °C
 * @retval pH_ReadingTypeDef structure with all measurements
 */
pH_ReadingTypeDef pH_ReadSensor(float temperature)
{
    pH_ReadingTypeDef reading = {0};

    // Read raw ADC value
    reading.adcValue = pH_ReadRawADC();

    // Convert to voltage
    reading.voltage = pH_ADCToVoltage(reading.adcValue);

    // Store temperature
    reading.temperature = temperature;

    // Check if reading is valid (sensor connected)
    if (IS_PH_ADC_VALID(reading.adcValue))
    {
        reading.isValid = 1;

        // Calculate pH value with temperature compensation
        reading.phValue = pH_VoltageToPhValue(reading.voltage, temperature);
    }
    else
    {
        reading.isValid = 0;
        reading.phValue = 7.0f;  // Default neutral when no sensor
    }

    return reading;
}

/**
 * @brief Read pH sensor with default temperature (25°C)
 * @retval pH_ReadingTypeDef structure
 */
pH_ReadingTypeDef pH_ReadSensorDefault(void)
{
    return pH_ReadSensor(PH_REFERENCE_TEMP);
}

/**
 * @brief Get just the pH value
 * @retval pH value (0.0-14.0)
 */
float pH_GetValue(void)
{
    pH_ReadingTypeDef reading = pH_ReadSensorDefault();
    return reading.phValue;
}

/**
 * @brief Convert voltage to pH value with temperature compensation
 * @param voltage: Voltage in mV
 * @param temperature: Temperature in °C
 * @retval pH value
 */
float pH_VoltageToPhValue(float voltage, float temperature)
{
    float phValue;

    // Use improved calibration equation based on your sensor readings
    // Linear mapping: higher voltage = more acidic (lower pH)
    phValue = 14.0f - ((voltage - 500.0f) / phCalibration.slope);

    // Alternative equation if above doesn't work well:
    // phValue = PH_NEUTRAL_VALUE + (phCalibration.neutralVoltage - voltage) / phCalibration.slope;

    // Apply temperature compensation
    phValue = pH_ApplyTemperatureCompensation(phValue, temperature);

    // Constrain to valid pH range
    if (phValue < PH_MIN_VALUE) phValue = PH_MIN_VALUE;
    if (phValue > PH_MAX_VALUE) phValue = PH_MAX_VALUE;

    return phValue;
}

/**
 * @brief Get pH status string
 * @param phValue: pH value to classify
 * @retval Pointer to status string
 */
const char* pH_GetStatusString(float phValue)
{
    if (phValue < 0.0f || phValue > 14.0f)
    {
        return "Invalid";
    }
    else if (phValue < 6.5f)
    {
        return "Acidic";
    }
    else if (phValue > 7.5f)
    {
        return "Alkaline";
    }
    else
    {
        return "Neutral";
    }
}

/**
 * @brief Calibrate pH sensor with single point (pH 7.0)
 * @param voltage: Measured voltage at pH 7.0 in mV
 * @retval HAL status
 */
HAL_StatusTypeDef pH_CalibrateSinglePoint(float voltage)
{
    if (voltage <= 0.0f || voltage > PH_SENSOR_VREF)
    {
        return HAL_ERROR;
    }

    phCalibration.neutralVoltage = voltage;
    phCalibration.isCalibrated = 1;

    return HAL_OK;
}

/**
 * @brief Calibrate pH sensor with two points (pH 4.0 and pH 7.0)
 * @param voltage4: Measured voltage at pH 4.0 in mV
 * @param voltage7: Measured voltage at pH 7.0 in mV
 * @retval HAL status
 */
HAL_StatusTypeDef pH_CalibrateTwoPoint(float voltage4, float voltage7)
{
    if (voltage4 <= 0.0f || voltage7 <= 0.0f ||
        voltage4 > PH_SENSOR_VREF || voltage7 > PH_SENSOR_VREF)
    {
        return HAL_ERROR;
    }

    // Check if voltages are different enough for reliable calibration
    if (fabs(voltage4 - voltage7) < 50.0f) // Minimum 50mV difference
    {
        return HAL_ERROR;
    }

    phCalibration.neutralVoltage = voltage7;
    phCalibration.acidVoltage = voltage4;
    phCalibration.slope = pH_CalculateSlope(voltage4, voltage7);
    phCalibration.isCalibrated = 1;

    return HAL_OK;
}

/**
 * @brief Reset calibration to default values
 * @retval HAL status
 */
HAL_StatusTypeDef pH_ResetCalibration(void)
{
    phCalibration.neutralVoltage = PH_DEFAULT_NEUTRAL_VOLTAGE;
    phCalibration.acidVoltage = 0.0f;
    phCalibration.slope = PH_DEFAULT_SLOPE;
    phCalibration.isCalibrated = 0;

    return HAL_OK;
}

/**
 * @brief Get current calibration data
 * @retval pH_CalibrationTypeDef structure
 */
pH_CalibrationTypeDef pH_GetCalibration(void)
{
    return phCalibration;
}

/**
 * @brief Check if sensor reading is valid
 * @param reading: pH reading structure
 * @retval 1 if valid, 0 if invalid
 */
uint8_t pH_IsReadingValid(pH_ReadingTypeDef reading)
{
    return reading.isValid;
}
