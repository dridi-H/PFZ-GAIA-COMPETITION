/**
 * @file amg8833.h
 * @brief AMG8833 Thermal Camera Driver Header
 * @date March 21, 2025
 *
 * Header file for the AMG8833 8x8 IR thermal camera driver
 */

#ifndef AMG8833_H
#define AMG8833_H

#include "main.h"
#include <stdint.h>

/* AMG8833 I2C Configuration */
#define AMG8833_I2C                 hi2c2          // I2C handle
#define AMG8833_ADDR               (0x69 << 1)    // I2C address (0x69 shifted for STM32 HAL)

/* AMG8833 Register Addresses */
#define AMG8833_POWER_CTRL         0x00    // Power control register
#define AMG8833_RESET              0x01    // Reset register
#define AMG8833_FPSC               0x02    // Frame rate control register
#define AMG8833_INTC               0x03    // Interrupt control register
#define AMG8833_STAT               0x04    // Status register
#define AMG8833_SCLR               0x05    // Status clear register
#define AMG8833_AVE                0x07    // Average register
#define AMG8833_INTHL              0x08    // Interrupt level upper limit LSB
#define AMG8833_INTHH              0x09    // Interrupt level upper limit MSB
#define AMG8833_INTLL              0x0A    // Interrupt level lower limit LSB
#define AMG8833_INTLH              0x0B    // Interrupt level lower limit MSB
#define AMG8833_IHYSL              0x0C    // Interrupt hysteresis LSB
#define AMG8833_IHYSH              0x0D    // Interrupt hysteresis MSB
#define AMG8833_TTHL               0x0E    // Thermistor temperature LSB
#define AMG8833_TTHH               0x0F    // Thermistor temperature MSB
#define AMG8833_INT_OFFSET         0x010   // Interrupt table offset
#define AMG8833_TEMP_BASE          0x80    // Temperature register base address

/* AMG8833 Power Control Values */
#define AMG8833_NORMAL_MODE        0x00    // Normal operation mode
#define AMG8833_SLEEP_MODE         0x10    // Sleep mode
#define AMG8833_STANDBY_60         0x20    // Stand-by mode (60 seconds intermittent)
#define AMG8833_STANDBY_10         0x21    // Stand-by mode (10 seconds intermittent)

/* AMG8833 Reset Values */
#define AMG8833_SOFT_RESET         0x3F    // Software reset command
#define AMG8833_FLAG_RESET         0x30    // Flag reset command
#define AMG8833_INITIAL_RESET      0x3F    // Initial reset command

/* AMG8833 Frame Rate Values */
#define AMG8833_FPS_10             0x00    // 10 frames per second
#define AMG8833_FPS_1              0x01    // 1 frame per second

/* Temperature Conversion Factor */
#define AMG8833_TEMP_FACTOR        0.25f   // Temperature conversion factor (0.25°C per LSB)

/* Function Prototypes */

/**
 * @brief Initialize the AMG8833 sensor
 * @return HAL_OK if successful, HAL_ERROR otherwise
 */
HAL_StatusTypeDef AMG8833_Init(void);

/**
 * @brief Read all pixels from the AMG8833
 * @return HAL_OK if successful, HAL_ERROR otherwise
 */
HAL_StatusTypeDef AMG8833_ReadPixels(void);

/**
 * @brief Prepare data for ChirpStack transmission
 * @param buffer Output buffer where formatted data will be stored
 * @param bufferSize Size of the output buffer
 * @return Number of bytes written to buffer, or -1 on error
 */
int AMG8833_PrepareChirpStackData(uint8_t* buffer, uint16_t bufferSize);

/**
 * @brief Get min, max, and average temperature from last reading
 * @param min Pointer to store minimum temperature
 * @param max Pointer to store maximum temperature
 * @param avg Pointer to store average temperature
 */
void AMG8833_GetStats(float* min, float* max, float* avg);

/**
 * @brief Power down the AMG8833
 * @return HAL_OK if successful, HAL_ERROR otherwise
 */
HAL_StatusTypeDef AMG8833_Sleep(void);

/**
 * @brief Wake up the AMG8833 from sleep mode
 * @return HAL_OK if successful, HAL_ERROR otherwise
 */
HAL_StatusTypeDef AMG8833_WakeUp(void);

/**
 * @brief Get raw pixel temperatures
 * @param pixelValues Pointer to buffer for storing the raw pixel values (must be at least 64 int16_t elements)
 */
void AMG8833_GetRawPixels(int16_t* pixelValues);

/**
 * @brief Get temperature values in Celsius
 * @param pixelValues Pointer to buffer for storing the temperature values (must be at least 64 float elements)
 */
void AMG8833_GetTemperatures(float* pixelValues);

#endif /* AMG8833_H */
