/**
 * @file amg8833.c
 * @brief AMG8833 Thermal Camera Driver Implementation
 * @date March 21, 2025
 *
 * Implementation of the AMG8833 8x8 IR thermal camera driver
 */

#include "amg8833.h"
#include "dev_conf.h"
#include "i2c.h"
#include <string.h>
#include <stdio.h>

/* Buffer for 8x8 grid of temperature values (64 pixels) */
static int16_t pixelTemperatureRaw[64];
static float pixelTemperature[64];

/**
 * @brief Initialize the AMG8833 sensor
 * @return HAL_OK if successful, HAL_ERROR otherwise
 */
HAL_StatusTypeDef AMG8833_Init(void)
{
    uint8_t config;
    HAL_StatusTypeDef status;

    // Software reset
    config = AMG8833_SOFT_RESET;
    status = HAL_I2C_Mem_Write(&AMG8833_I2C, AMG8833_ADDR, AMG8833_RESET, I2C_MEMADD_SIZE_8BIT, &config, 1, 100);
    if (status != HAL_OK) {
        return status;
    }

    // Wait for reset to complete
    HAL_Delay(100);

    // Set normal mode
    config = AMG8833_NORMAL_MODE;
    status = HAL_I2C_Mem_Write(&AMG8833_I2C, AMG8833_ADDR, AMG8833_POWER_CTRL, I2C_MEMADD_SIZE_8BIT, &config, 1, 100);
    if (status != HAL_OK) {
        return status;
    }

    // Set frame rate to 10 FPS
    config = AMG8833_FPS_10;
    status = HAL_I2C_Mem_Write(&AMG8833_I2C, AMG8833_ADDR, AMG8833_FPSC, I2C_MEMADD_SIZE_8BIT, &config, 1, 100);
    if (status != HAL_OK) {
        return status;
    }

    // Wait for thermistor to stabilize
    HAL_Delay(100);

    return HAL_OK;
}

/**
 * @brief Read all pixels from the AMG8833
 * @return HAL_OK if successful, HAL_ERROR otherwise
 */
HAL_StatusTypeDef AMG8833_ReadPixels(void)
{
    uint8_t rawData[128]; // 2 bytes per pixel * 64 pixels
    HAL_StatusTypeDef status;

    // Read all 64 temperature registers at once
    status = HAL_I2C_Mem_Read(&AMG8833_I2C, AMG8833_ADDR, AMG8833_TEMP_BASE, I2C_MEMADD_SIZE_8BIT, rawData, 128, 1000);
    if (status != HAL_OK) {
        return status;
    }

    // Process the raw data
    for (int i = 0; i < 64; i++) {
        // Combine the two bytes to create a 12-bit signed value
        // Data is stored in 12-bit, sign extended to 16-bit, LSB first
        pixelTemperatureRaw[i] = (int16_t)(rawData[i*2] | (rawData[i*2+1] << 8));

        // Convert raw value to temperature in Celsius
        pixelTemperature[i] = pixelTemperatureRaw[i] * AMG8833_TEMP_FACTOR;
    }

    return HAL_OK;
}

/**
 * @brief Prepare data for ChirpStack transmission
 * @param buffer Output buffer where formatted data will be stored
 * @param bufferSize Size of the output buffer
 * @return Number of bytes written to buffer, or -1 on error
 */
int AMG8833_PrepareChirpStackData(uint8_t* buffer, uint16_t bufferSize)
{
    // Check if buffer is large enough (at minimum we need 64 bytes for 1 byte per pixel)
    if (bufferSize < 64) {
        return -1;
    }

    // Option 1: Send raw 12-bit values (128 bytes total)
    // This preserves full resolution but uses more bandwidth
    if (bufferSize >= 128) {
        for (int i = 0; i < 64; i++) {
            // Store each 16-bit value (LSB first)
            buffer[i*2] = pixelTemperatureRaw[i] & 0xFF;
            buffer[i*2+1] = (pixelTemperatureRaw[i] >> 8) & 0xFF;
        }
        return 128;
    }

    // Option 2: Compress to 8-bit values for lower bandwidth
    // This maps temperature range from -20°C to 80°C to 0-255 value range (25°C = 127)
    else {
        for (int i = 0; i < 64; i++) {
            // Convert temperature to 8-bit range (100°C range mapped to 0-255)
            float temp = pixelTemperature[i];
            // Clamp to expected range
            if (temp < -20.0f) temp = -20.0f;
            if (temp > 80.0f) temp = 80.0f;
            // Map to 0-255 range
            buffer[i] = (uint8_t)((temp + 20.0f) * 2.55f);
        }
        return 64;
    }
}

/**
 * @brief Get min, max, and average temperature from last reading
 * @param min Pointer to store minimum temperature
 * @param max Pointer to store maximum temperature
 * @param avg Pointer to store average temperature
 */
void AMG8833_GetStats(float* min, float* max, float* avg)
{
    *min = pixelTemperature[0];
    *max = pixelTemperature[0];
    float sum = 0.0f;

    for (int i = 0; i < 64; i++) {
        if (pixelTemperature[i] < *min) *min = pixelTemperature[i];
        if (pixelTemperature[i] > *max) *max = pixelTemperature[i];
        sum += pixelTemperature[i];
    }

    *avg = sum / 64.0f;
}

/**
 * @brief Power down the AMG8833
 * @return HAL_OK if successful, HAL_ERROR otherwise
 */
HAL_StatusTypeDef AMG8833_Sleep(void)
{
    uint8_t config = AMG8833_SLEEP_MODE;
    return HAL_I2C_Mem_Write(&AMG8833_I2C, AMG8833_ADDR, AMG8833_POWER_CTRL, I2C_MEMADD_SIZE_8BIT, &config, 1, 100);
}

/**
 * @brief Wake up the AMG8833 from sleep mode
 * @return HAL_OK if successful, HAL_ERROR otherwise
 */
HAL_StatusTypeDef AMG8833_WakeUp(void)
{
    uint8_t config = AMG8833_NORMAL_MODE;
    HAL_StatusTypeDef status;

    status = HAL_I2C_Mem_Write(&AMG8833_I2C, AMG8833_ADDR, AMG8833_POWER_CTRL, I2C_MEMADD_SIZE_8BIT, &config, 1, 100);
    if (status != HAL_OK) {
        return status;
    }

    // Wait for sensor to wake up
    HAL_Delay(50);

    return HAL_OK;
}

/**
 * @brief Get raw pixel temperatures
 * @param pixelValues Pointer to buffer for storing the raw pixel values (must be at least 64 int16_t elements)
 */
void AMG8833_GetRawPixels(int16_t* pixelValues)
{
    memcpy(pixelValues, pixelTemperatureRaw, 64 * sizeof(int16_t));
}

/**
 * @brief Get temperature values in Celsius
 * @param pixelValues Pointer to buffer for storing the temperature values (must be at least 64 float elements)
 */
void AMG8833_GetTemperatures(float* pixelValues)
{
    memcpy(pixelValues, pixelTemperature, 64 * sizeof(float));
}
