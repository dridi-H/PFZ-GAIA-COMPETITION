/**
  ******************************************************************************
  * @file    ds18b20.c
  * @brief   Simple DS18B20 Driver - Just Works
  ******************************************************************************
  */

/* Includes ------------------------------------------------------------------*/
#include "ds18b20.h"

/* Private variables ---------------------------------------------------------*/
static bool ds18b20_working = false;

/* Private functions ---------------------------------------------------------*/
static void DS18B20_DelayUs(uint32_t us);
static bool DS18B20_Reset(void);
static void DS18B20_WriteByte(uint8_t byte);
static uint8_t DS18B20_ReadByte(void);
static void DS18B20_WriteBit(uint8_t bit);
static uint8_t DS18B20_ReadBit(void);

/* Public Functions ----------------------------------------------------------*/

/**
 * @brief Initialize DS18B20 sensor
 * @retval DS18B20_Status_t: DS18B20_OK if successful
 */
DS18B20_Status_t DS18B20_Init(void)
{
    /* Enable GPIO clock */
    __HAL_RCC_GPIOB_CLK_ENABLE();

    /* Configure pin as open-drain output with pull-up */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = DS18B20_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(DS18B20_PORT, &GPIO_InitStruct);

    /* Set pin high */
    HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_SET);

    /* Wait for sensor to stabilize */
    HAL_Delay(500);

    /* Test if sensor is present */
    if (DS18B20_Reset()) {
        ds18b20_working = true;
        return DS18B20_OK;
    } else {
        ds18b20_working = false;
        return DS18B20_ERROR;
    }
}

/**
 * @brief Read temperature from DS18B20
 * @param temperature: pointer to store temperature value in Celsius
 * @retval DS18B20_Status_t: DS18B20_OK if successful
 */
DS18B20_Status_t DS18B20_ReadTemperature(float *temperature)
{
    if (!ds18b20_working || temperature == NULL) {
        return DS18B20_ERROR;
    }

    /* Reset and check presence */
    if (!DS18B20_Reset()) {
        ds18b20_working = false;
        return DS18B20_ERROR;
    }

    /* Start conversion */
    DS18B20_WriteByte(DS18B20_CMD_SKIP_ROM);
    DS18B20_WriteByte(DS18B20_CMD_CONVERT_T);

    /* Wait for conversion (750ms for 12-bit) */
    HAL_Delay(800);

    /* Reset and check presence */
    if (!DS18B20_Reset()) {
        return DS18B20_ERROR;
    }

    /* Read scratchpad */
    DS18B20_WriteByte(DS18B20_CMD_SKIP_ROM);
    DS18B20_WriteByte(DS18B20_CMD_READ_SCRATCHPAD);

    /* Read temperature bytes (LSB first, then MSB) */
    uint8_t temp_lsb = DS18B20_ReadByte();
    uint8_t temp_msb = DS18B20_ReadByte();

    /* Combine bytes to form temperature */
    int16_t raw_temp = (temp_msb << 8) | temp_lsb;

    /* Convert to Celsius (0.0625°C per bit for 12-bit resolution) */
    *temperature = (float)raw_temp * 0.0625f;

    /* Basic validation */
    if (*temperature < -55.0f || *temperature > 125.0f) {
        return DS18B20_ERROR;
    }

    return DS18B20_OK;
}

/**
 * @brief Check if DS18B20 is working
 * @retval true if working, false otherwise
 */
bool DS18B20_IsWorking(void)
{
    return ds18b20_working;
}

/* Private Functions ---------------------------------------------------------*/

/**
 * @brief Microsecond delay
 * @param us: microseconds to delay
 */
static void DS18B20_DelayUs(uint32_t us)
{
    /* Simple delay using system clock */
    uint32_t cycles = us * (SystemCoreClock / 1000000);
    for (uint32_t i = 0; i < cycles / 4; i++) {
        __NOP();
    }
}

/**
 * @brief Send reset pulse and check for presence
 * @retval true if device responds
 */
static bool DS18B20_Reset(void)
{
    bool presence = false;

    /* Configure as output */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = DS18B20_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(DS18B20_PORT, &GPIO_InitStruct);

    /* Send reset pulse */
    HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_RESET);
    DS18B20_DelayUs(480);
    HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_SET);

    /* Configure as input to read presence pulse */
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    HAL_GPIO_Init(DS18B20_PORT, &GPIO_InitStruct);

    DS18B20_DelayUs(70);

    /* Check for presence pulse */
    if (HAL_GPIO_ReadPin(DS18B20_PORT, DS18B20_PIN) == GPIO_PIN_RESET) {
        presence = true;
    }

    DS18B20_DelayUs(410);

    /* Configure back as output */
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
    HAL_GPIO_Init(DS18B20_PORT, &GPIO_InitStruct);
    HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_SET);

    return presence;
}

/**
 * @brief Write a byte to DS18B20
 * @param byte: byte to write
 */
static void DS18B20_WriteByte(uint8_t byte)
{
    for (int i = 0; i < 8; i++) {
        DS18B20_WriteBit((byte >> i) & 0x01);
    }
}

/**
 * @brief Read a byte from DS18B20
 * @retval byte read from sensor
 */
static uint8_t DS18B20_ReadByte(void)
{
    uint8_t byte = 0;
    for (int i = 0; i < 8; i++) {
        byte |= (DS18B20_ReadBit() << i);
    }
    return byte;
}

/**
 * @brief Write a bit to DS18B20
 * @param bit: bit to write (0 or 1)
 */
static void DS18B20_WriteBit(uint8_t bit)
{
    /* Configure as output */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = DS18B20_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(DS18B20_PORT, &GPIO_InitStruct);

    if (bit) {
        /* Write 1 */
        HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_RESET);
        DS18B20_DelayUs(6);
        HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_SET);
        DS18B20_DelayUs(64);
    } else {
        /* Write 0 */
        HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_RESET);
        DS18B20_DelayUs(60);
        HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_SET);
        DS18B20_DelayUs(10);
    }
}

/**
 * @brief Read a bit from DS18B20
 * @retval bit value (0 or 1)
 */
static uint8_t DS18B20_ReadBit(void)
{
    uint8_t bit = 0;

    /* Configure as output */
    GPIO_InitTypeDef GPIO_InitStruct = {0};
    GPIO_InitStruct.Pin = DS18B20_PIN;
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
    GPIO_InitStruct.Pull = GPIO_PULLUP;
    GPIO_InitStruct.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(DS18B20_PORT, &GPIO_InitStruct);

    /* Start read slot */
    HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_RESET);
    DS18B20_DelayUs(3);

    /* Configure as input */
    GPIO_InitStruct.Mode = GPIO_MODE_INPUT;
    HAL_GPIO_Init(DS18B20_PORT, &GPIO_InitStruct);

    DS18B20_DelayUs(10);

    /* Read bit */
    if (HAL_GPIO_ReadPin(DS18B20_PORT, DS18B20_PIN) == GPIO_PIN_SET) {
        bit = 1;
    }

    DS18B20_DelayUs(53);

    /* Configure back as output */
    GPIO_InitStruct.Mode = GPIO_MODE_OUTPUT_OD;
    HAL_GPIO_Init(DS18B20_PORT, &GPIO_InitStruct);
    HAL_GPIO_WritePin(DS18B20_PORT, DS18B20_PIN, GPIO_PIN_SET);

    return bit;
}

/**************************** END OF FILE ************************************/
