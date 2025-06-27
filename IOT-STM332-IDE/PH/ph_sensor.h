/**
  ******************************************************************************
  * @file    ph_sensor.h
  * @brief   pH sensor functions header file - Complete Working Version
  * @note    Compatible with DFRobot SEN0161 pH sensor on PB1 pin
  ******************************************************************************
  */

/* Define to prevent recursive inclusion -------------------------------------*/
#ifndef __PH_SENSOR_H
#define __PH_SENSOR_H

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "adc.h"
#include <math.h>

/* Exported types ------------------------------------------------------------*/
typedef struct {
    float voltage;          // Raw voltage reading in mV
    float phValue;          // Calculated pH value
    float temperature;      // Temperature for compensation
    uint16_t adcValue;      // Raw ADC value (0-4095)
    uint8_t isValid;        // 1 if reading is valid, 0 if sensor disconnected
} pH_ReadingTypeDef;

typedef struct {
    float neutralVoltage;   // Voltage at pH 7.0 (mV)
    float acidVoltage;      // Voltage at pH 4.0 (mV)
    float slope;            // Calibration slope (mV/pH)
    uint8_t isCalibrated;   // 1 if calibrated, 0 if using defaults
} pH_CalibrationTypeDef;

/* Exported constants --------------------------------------------------------*/
// Hardware Configuration - Based on your ADC configuration
#define PH_SENSOR_CHANNEL           ADC_CHANNEL_5    // PB1 pin (ADC_IN5)
#define PH_SENSOR_VREF              3300             // Reference voltage in mV
#define PH_SENSOR_ADC_RESOLUTION    4095             // 12-bit ADC resolution
#define PH_ADC_CHANNEL_RANK         2                // pH is Rank 3 = index 2 (ADC_CHANNEL_5/PB1)

/* pH sensor calibration constants */
#define PH_NEUTRAL_VALUE            7.0f             // Neutral pH value
#define PH_ACID_VALUE               4.0f             // Acid buffer pH value
#define PH_DEFAULT_SLOPE            250.0f           // Default slope (mV/pH)
#define PH_DEFAULT_NEUTRAL_VOLTAGE  1800.0f          // Default voltage at pH 7.0 (mV)

/* Temperature compensation */
#define PH_TEMP_COEFFICIENT         0.003f           // Temperature coefficient (%/°C)
#define PH_REFERENCE_TEMP           25.0f            // Reference temperature (°C)

/* Measurement parameters */
#define PH_MIN_ADC_VALUE            100              // Minimum ADC for valid reading
#define PH_MAX_ADC_VALUE            3900             // Maximum ADC for valid reading

/* pH ranges */
#define PH_MIN_VALUE                0.0f
#define PH_MAX_VALUE                14.0f

/* Exported macro ------------------------------------------------------------*/
#define IS_PH_VALID(ph)            ((ph >= PH_MIN_VALUE) && (ph <= PH_MAX_VALUE))
#define IS_PH_ADC_VALID(adc)       ((adc >= PH_MIN_ADC_VALUE) && (adc <= PH_MAX_ADC_VALUE) && (adc != 0))

/* Exported functions prototypes ---------------------------------------------*/

/**
 * @brief  Initialize pH sensor
 * @retval HAL status
 */
HAL_StatusTypeDef pH_Init(void);

/**
 * @brief  Read pH sensor raw ADC value
 * @retval Raw ADC value (0-4095)
 */
uint16_t pH_ReadRawADC(void);

/**
 * @brief  Convert ADC value to voltage
 * @param  adcValue: Raw ADC value
 * @retval Voltage in mV
 */
float pH_ADCToVoltage(uint16_t adcValue);

/**
 * @brief  Read pH sensor with temperature compensation
 * @param  temperature: Current temperature in °C
 * @retval pH_ReadingTypeDef structure with all measurements
 */
pH_ReadingTypeDef pH_ReadSensor(float temperature);

/**
 * @brief  Read pH sensor with default temperature (25°C)
 * @retval pH_ReadingTypeDef structure
 */
pH_ReadingTypeDef pH_ReadSensorDefault(void);

/**
 * @brief  Get just the pH value
 * @retval pH value (0.0-14.0)
 */
float pH_GetValue(void);

/**
 * @brief  Get pH status string
 * @param  phValue: pH value to classify
 * @retval Pointer to status string ("Acidic", "Neutral", "Alkaline", "Invalid")
 */
const char* pH_GetStatusString(float phValue);

/**
 * @brief  Convert voltage to pH value with temperature compensation
 * @param  voltage: Voltage in mV
 * @param  temperature: Temperature in °C
 * @retval pH value
 */
float pH_VoltageToPhValue(float voltage, float temperature);

/**
 * @brief  Calibrate pH sensor with single point (pH 7.0)
 * @param  voltage: Measured voltage at pH 7.0 in mV
 * @retval HAL status
 */
HAL_StatusTypeDef pH_CalibrateSinglePoint(float voltage);

/**
 * @brief  Calibrate pH sensor with two points (pH 4.0 and pH 7.0)
 * @param  voltage4: Measured voltage at pH 4.0 in mV
 * @param  voltage7: Measured voltage at pH 7.0 in mV
 * @retval HAL status
 */
HAL_StatusTypeDef pH_CalibrateTwoPoint(float voltage4, float voltage7);

/**
 * @brief  Reset calibration to default values
 * @retval HAL status
 */
HAL_StatusTypeDef pH_ResetCalibration(void);

/**
 * @brief  Get current calibration data
 * @retval pH_CalibrationTypeDef structure
 */
pH_CalibrationTypeDef pH_GetCalibration(void);

/**
 * @brief  Check if sensor reading is valid
 * @param  reading: pH reading structure
 * @retval 1 if valid, 0 if invalid
 */
uint8_t pH_IsReadingValid(pH_ReadingTypeDef reading);

#ifdef __cplusplus
}
#endif

#endif /* __PH_SENSOR_H */
