/**
  ******************************************************************************
  * @file    tds_sensor.h
  * @brief   TDS (Total Dissolved Solids) sensor functions header
  * @note    Compatible with TDS sensor module on PB3 pin (ADC_CHANNEL_2)
  ******************************************************************************
  */

#ifndef __TDS_SENSOR_H
#define __TDS_SENSOR_H

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "adc.h"
#include <math.h>

/* Exported types ------------------------------------------------------------*/

/**
 * @brief TDS sensor reading structure
 */
typedef struct {
    uint16_t adcValue;          // Raw ADC value (0-4095)
    float voltage;              // Voltage in mV
    float conductivity;         // Electrical conductivity in uS/cm
    float tdsValue;             // TDS value in ppm
    float temperature;          // Temperature used for compensation
    uint8_t isValid;           // 1 if reading is valid, 0 if invalid
    const char* waterQuality;   // Water quality classification string
} TDS_ReadingTypeDef;

/**
 * @brief TDS sensor calibration structure
 */
typedef struct {
    float kValue;              // Calibration constant (default ~1.0)
    float offsetVoltage;       // Voltage offset in mV
    uint8_t isCalibrated;      // Calibration status
} TDS_CalibrationTypeDef;

/* Exported constants --------------------------------------------------------*/

// Hardware Configuration - Based on your ADC configuration
#define TDS_SENSOR_VREF                3300.0f     // Reference voltage in mV
#define TDS_SENSOR_ADC_RESOLUTION      4095.0f     // 12-bit ADC resolution
#define TDS_ADC_CHANNEL_RANK           0           // TDS is Rank 1 = index 0 (ADC_CHANNEL_2/PB3)

// TDS Calculation Constants
#define TDS_DEFAULT_K_VALUE            1.0f        // Default calibration constant
#define TDS_DEFAULT_OFFSET             0.0f        // Default voltage offset
#define TDS_TEMP_COEFFICIENT           0.02f       // Temperature coefficient (2%/°C)
#define TDS_REFERENCE_TEMP             25.0f       // Reference temperature (°C)

// TDS Value Ranges (ppm)
#define TDS_MIN_VALUE                  0.0f
#define TDS_MAX_VALUE                  2000.0f
#define TDS_EXCELLENT_MAX              300.0f      // Excellent water
#define TDS_GOOD_MAX                   600.0f      // Good water
#define TDS_FAIR_MAX                   900.0f      // Fair water
#define TDS_POOR_MAX                   1200.0f     // Poor water
#define TDS_UNACCEPTABLE_MAX           2000.0f     // Unacceptable water

// Enhanced validation for better disconnected sensor detection
#define TDS_FLOATING_ADC_MIN           1200        // Typical floating range start
#define TDS_FLOATING_ADC_MAX           2400        // Typical floating range end
#define TDS_CLEAN_WATER_ADC_MAX        800         // Clean water max ADC
#define TDS_CONDUCTIVE_WATER_ADC_MIN   2500        // Conductive water min ADC

// Validation Macros - More restrictive to detect disconnected sensors
#define IS_TDS_ADC_VALID(adc)          ((adc) < TDS_FLOATING_ADC_MIN || (adc) > TDS_FLOATING_ADC_MAX)
#define IS_TDS_VOLTAGE_VALID(voltage)  ((voltage) > 50.0f && (voltage) < 3200.0f)
#define IS_TDS_VALUE_VALID(tds)        ((tds) >= TDS_MIN_VALUE && (tds) <= TDS_MAX_VALUE)

/* Exported functions prototypes ---------------------------------------------*/

/**
 * @brief Initialize TDS sensor
 * @retval HAL status
 */
HAL_StatusTypeDef TDS_Init(void);

/**
 * @brief Read TDS sensor raw ADC value
 * @retval Raw ADC value (0-4095)
 */
uint16_t TDS_ReadRawADC(void);

/**
 * @brief Convert ADC value to voltage
 * @param adcValue: Raw ADC value
 * @retval Voltage in mV
 */
float TDS_ADCToVoltage(uint16_t adcValue);

/**
 * @brief Convert voltage to conductivity
 * @param voltage: Voltage in mV
 * @param temperature: Temperature in °C for compensation
 * @retval Conductivity in uS/cm
 */
float TDS_VoltageToconductivity(float voltage, float temperature);

/**
 * @brief Convert conductivity to TDS value
 * @param conductivity: Conductivity in uS/cm
 * @retval TDS value in ppm
 */
float TDS_ConductivityToTDS(float conductivity);

/**
 * @brief Enhanced sensor connection detection
 * @param reading: TDS reading structure
 * @retval 1 if sensor is connected, 0 if disconnected
 */
uint8_t TDS_IsSensorConnected(TDS_ReadingTypeDef reading);

/**
 * @brief Read TDS sensor with temperature compensation
 * @param temperature: Current temperature in °C
 * @retval TDS_ReadingTypeDef structure with all measurements
 */
TDS_ReadingTypeDef TDS_ReadSensor(float temperature);

/**
 * @brief Read TDS sensor with default temperature (25°C)
 * @retval TDS_ReadingTypeDef structure
 */
TDS_ReadingTypeDef TDS_ReadSensorDefault(void);

/**
 * @brief Get just the TDS value
 * @retval TDS value in ppm
 */
float TDS_GetValue(void);

/**
 * @brief Get water quality classification string
 * @param tdsValue: TDS value in ppm
 * @retval Pointer to water quality string
 */
const char* TDS_GetWaterQualityString(float tdsValue);

/**
 * @brief Calibrate TDS sensor with known solution
 * @param knownTDS: Known TDS value of calibration solution in ppm
 * @param measuredVoltage: Measured voltage in mV
 * @retval HAL status
 */
HAL_StatusTypeDef TDS_Calibrate(float knownTDS, float measuredVoltage);

/**
 * @brief Reset calibration to default values
 * @retval HAL status
 */
HAL_StatusTypeDef TDS_ResetCalibration(void);

/**
 * @brief Get current calibration data
 * @retval TDS_CalibrationTypeDef structure
 */
TDS_CalibrationTypeDef TDS_GetCalibration(void);

/**
 * @brief Check if TDS reading is valid
 * @param reading: TDS reading structure
 * @retval 1 if valid, 0 if invalid
 */
uint8_t TDS_IsReadingValid(TDS_ReadingTypeDef reading);

/**
 * @brief Apply temperature compensation to conductivity
 * @param conductivity: Raw conductivity value
 * @param temperature: Current temperature in °C
 * @retval Temperature compensated conductivity
 */
float TDS_ApplyTemperatureCompensation(float conductivity, float temperature);

#ifdef __cplusplus
}
#endif

#endif /* __TDS_SENSOR_H */
