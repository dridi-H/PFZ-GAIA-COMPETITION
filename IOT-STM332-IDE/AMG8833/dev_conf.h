/**
 * @file dev_conf.h
 * @brief Device Configuration Header for AMG8833
 * @date March 21, 2025
 *
 * Configuration settings and constants for the AMG8833 thermal camera
 */

#ifndef DEV_CONF_H
#define DEV_CONF_H

#include "main.h"	
#include "i2c.h"

/* AMG8833 I2C Configuration */
extern I2C_HandleTypeDef hi2c2;           // I2C handle used for AMG8833 communication
#define AMG8833_I2C                hi2c2  // I2C interface for AMG8833

/* AMG8833 I2C Address */
#define AMG8833_ADDR              (0x69 << 1) // Default address (0x69), shifted left for STM32 HAL

/* AMG8833 Registers */
#define AMG8833_POWER_CTRL        0x00 // Power control register
#define AMG8833_RESET             0x01 // Reset register
#define AMG8833_FPSC              0x02 // Frame rate register
#define AMG8833_INT_CTRL          0x03 // Interrupt control register
#define AMG8833_STATUS            0x04 // Status register
#define AMG8833_STATUS_CLEAR      0x05 // Status clear register
#define AMG8833_AVERAGE           0x07 // Moving average register
#define AMG8833_INT_LEVEL_UPPER   0x08 // Upper interrupt level
#define AMG8833_INT_LEVEL_LOWER   0x0A // Lower interrupt level
#define AMG8833_INT_LEVEL_HYST    0x0C // Hysteresis interrupt level
#define AMG8833_THERMISTOR        0x0E // Thermistor register
#define AMG8833_INT_TABLE_1_8     0x10 // Interrupt table 1_8
#define AMG8833_INT_TABLE_9_16    0x11 // Interrupt table 9_16
#define AMG8833_INT_TABLE_17_24   0x12 // Interrupt table 17_24
#define AMG8833_INT_TABLE_25_32   0x13 // Interrupt table 25_32
#define AMG8833_INT_TABLE_33_40   0x14 // Interrupt table 33_40
#define AMG8833_INT_TABLE_41_48   0x15 // Interrupt table 41_48
#define AMG8833_INT_TABLE_49_56   0x16 // Interrupt table 49_56
#define AMG8833_INT_TABLE_57_64   0x17 // Interrupt table 57_64
#define AMG8833_TEMP_BASE         0x80 // Temperature registers (0x80-0xFF for 8x8 IR pixels)

/* AMG8833 Configuration Values */
#define AMG8833_NORMAL_MODE       0x00 // Normal mode
#define AMG8833_SLEEP_MODE        0x10 // Sleep mode
#define AMG8833_STAND_BY          0x20 // Stand-by mode (10 sec intermittence)
#define AMG8833_SOFT_RESET        0x3F // Software reset
#define AMG8833_FPS_10            0x00 // 10 FPS operation
#define AMG8833_FPS_1             0x01 // 1 FPS operation

/* Temperature conversion constants */
#define AMG8833_TEMP_FACTOR       0.25f // Each raw value equals 0.25°C

/* Temperature range of the sensor */
#define AMG8833_TEMP_MIN         -20.0f // Minimum temperature in °C
#define AMG8833_TEMP_MAX          80.0f // Maximum temperature in °C
#define AMG8833_TEMP_RANGE       100.0f // Temperature range in °C

/* Communication timing */
#define AMG8833_INIT_DELAY        100   // Delay after initialization in ms
#define AMG8833_RESET_DELAY       100   // Delay after reset in ms
#define AMG8833_WAKEUP_DELAY       50   // Delay after wakeup in ms
#define AMG8833_I2C_TIMEOUT       100   // I2C timeout for short operations in ms
#define AMG8833_READ_TIMEOUT     1000   // I2C timeout for reading all pixels in ms

/* Other constants */
#define AMG8833_PIXEL_COUNT        64   // Number of pixels (8x8 grid)
#define AMG8833_GRID_SIZE           8   // Size of the grid (8x8)

#endif /* DEV_CONF_H */
