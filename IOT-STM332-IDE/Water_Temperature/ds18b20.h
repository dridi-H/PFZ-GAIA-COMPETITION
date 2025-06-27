/**
  ******************************************************************************
  * @file    ds18b20.h
  * @brief   Simple DS18B20 Driver - Just Works
  ******************************************************************************
  */

#ifndef DS18B20_H
#define DS18B20_H

#ifdef __cplusplus
extern "C" {
#endif

/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include <stdint.h>
#include <stdbool.h>

/* DS18B20 Pin Configuration -------------------------------------------------*/
#define DS18B20_PORT    GPIOB
#define DS18B20_PIN     GPIO_PIN_10

/* DS18B20 Commands ----------------------------------------------------------*/
#define DS18B20_CMD_CONVERT_T       0x44    /* Start temperature conversion */
#define DS18B20_CMD_READ_SCRATCHPAD 0xBE    /* Read scratchpad memory */
#define DS18B20_CMD_SKIP_ROM        0xCC    /* Skip ROM command */

/* DS18B20 Status ------------------------------------------------------------*/
typedef enum {
    DS18B20_OK = 0,
    DS18B20_ERROR = 1
} DS18B20_Status_t;

/* Public Functions ----------------------------------------------------------*/

/**
 * @brief Initialize DS18B20 sensor
 * @retval DS18B20_Status_t: DS18B20_OK if successful
 */
DS18B20_Status_t DS18B20_Init(void);

/**
 * @brief Read temperature from DS18B20
 * @param temperature: pointer to store temperature value in Celsius
 * @retval DS18B20_Status_t: DS18B20_OK if successful
 */
DS18B20_Status_t DS18B20_ReadTemperature(float *temperature);

/**
 * @brief Check if DS18B20 is working
 * @retval true if working, false otherwise
 */
bool DS18B20_IsWorking(void);

#ifdef __cplusplus
}
#endif

#endif /* DS18B20_H */
