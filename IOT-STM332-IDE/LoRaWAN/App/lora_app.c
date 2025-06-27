/**
  ******************************************************************************
  * @file    lora_app.c
  * @author  MCD Application Team
  * @brief   Application of the LRWAN Middleware
  ******************************************************************************
  * @attention
  *
  * <h2><center>&copy; Copyright (c) 2025 STMicroelectronics.
  * All rights reserved.</center></h2>
  *
  * This software component is licensed by ST under Ultimate Liberty license
  * SLA0044, the "License"; You may not use this file except in compliance with
  * the License. You may obtain a copy of the License at:
  *                             www.st.com/SLA0044
  *
  ******************************************************************************
  */

/* Includes ------------------------------------------------------------------*/
#include "platform.h"
#include "Region.h" /* Needed for LORAWAN_DEFAULT_DATA_RATE */
#include "sys_app.h"
#include "lora_app.h"
#include "stm32_seq.h"
#include "stm32_timer.h"
#include "utilities_def.h"
#include "lora_app_version.h"
#include "lorawan_version.h"
#include "subghz_phy_version.h"
#include "lora_info.h"
#include "LmHandler.h"
#include "stm32_lpm.h"
#include "adc_if.h"
#include "sys_conf.h"
#include "CayenneLpp.h"
#include "sys_sensors.h"



#include "../AMG8833/amg8833.h"
#include "../AMG8833/amg8833.C"
#include "../AMG8833/dev_conf.C"
#include "../AMG8833/dev_conf.h"

#include "../TDS/tds_sensor.h"
#include "../PH/ph_sensor.h"


#include "../TDS/tds_sensor.c"
#include "../PH/ph_sensor.c"


#include "../Water_Temperature/ds18b20.h"
#include "../Water_Temperature/ds18b20.c"
/* USER CODE BEGIN Includes */

/* USER CODE END Includes */

/* External variables ---------------------------------------------------------*/
/* USER CODE BEGIN EV */

/* USER CODE END EV */

/* Private typedef -----------------------------------------------------------*/
/**
  * @brief LoRa State Machine states
  */
typedef enum TxEventType_e
{
  /**
    * @brief AppdataTransmition issue based on timer every TxDutyCycleTime
    */
  TX_ON_TIMER,
  /**
    * @brief AppdataTransmition external event plugged on OnSendEvent( )
    */
  TX_ON_EVENT
  /* USER CODE BEGIN TxEventType_t */

  /* USER CODE END TxEventType_t */
} TxEventType_t;

/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private function prototypes -----------------------------------------------*/
/**
  * @brief  LoRa endNode send request
  * @param  none
  * @retval none
  */
static void SendTxData(void);

/**
  * @brief  TX timer callback function
  * @param  timer context
  * @retval none
  */
static void OnTxTimerEvent(void *context);

/**
  * @brief  LED Tx timer callback function
  * @param  LED context
  * @retval none
  */
static void OnTxTimerLedEvent(void *context);

/**
  * @brief  LED Rx timer callback function
  * @param  LED context
  * @retval none
  */
static void OnRxTimerLedEvent(void *context);

/**
  * @brief  LED Join timer callback function
  * @param  LED context
  * @retval none
  */
static void OnJoinTimerLedEvent(void *context);

/**
  * @brief  join event callback function
  * @param  params
  * @retval none
  */
static void OnJoinRequest(LmHandlerJoinParams_t *joinParams);

/**
  * @brief  tx event callback function
  * @param  params
  * @retval none
  */
static void OnTxData(LmHandlerTxParams_t *params);

/**
  * @brief callback when LoRa endNode has received a frame
  * @param appData
  * @param params
  * @retval None
  */
static void OnRxData(LmHandlerAppData_t *appData, LmHandlerRxParams_t *params);

/*!
 * Will be called each time a Radio IRQ is handled by the MAC layer
 *
 */
static void OnMacProcessNotify(void);

/* USER CODE BEGIN PFP */

/* USER CODE END PFP */

/* Private variables ---------------------------------------------------------*/
/**
  * @brief User application buffer
  */
static uint8_t AppDataBuffer[LORAWAN_APP_DATA_BUFFER_MAX_SIZE];

/**
  * @brief User application data structure
  */
static LmHandlerAppData_t AppData = { 0, 0, AppDataBuffer };

static ActivationType_t ActivationType = LORAWAN_DEFAULT_ACTIVATION_TYPE;

/**
  * @brief LoRaWAN handler Callbacks
  */
static LmHandlerCallbacks_t LmHandlerCallbacks =
{
  .GetBatteryLevel =           GetBatteryLevel,
  .GetTemperature =            GetTemperatureLevel,
  .OnMacProcess =              OnMacProcessNotify,
  .OnJoinRequest =             OnJoinRequest,
  .OnTxData =                  OnTxData,
  .OnRxData =                  OnRxData
};

/**
  * @brief LoRaWAN handler parameters
  */
static LmHandlerParams_t LmHandlerParams =
{
  .ActiveRegion =             ACTIVE_REGION,
  .DefaultClass =             LORAWAN_DEFAULT_CLASS,
  .AdrEnable =                LORAWAN_ADR_STATE,
  .TxDatarate =               LORAWAN_DEFAULT_DATA_RATE,
  .PingPeriodicity =          LORAWAN_DEFAULT_PING_SLOT_PERIODICITY
};

/**
  * @brief Specifies the state of the application LED
  */
static uint8_t AppLedStateOn = RESET;

/**
  * @brief Type of Event to generate application Tx
  */
static TxEventType_t EventType = TX_ON_TIMER;

/**
  * @brief Timer to handle the application Tx
  */
static UTIL_TIMER_Object_t TxTimer;

/**
  * @brief Timer to handle the application Tx Led to toggle
  */
static UTIL_TIMER_Object_t TxLedTimer;

/**
  * @brief Timer to handle the application Rx Led to toggle
  */
static UTIL_TIMER_Object_t RxLedTimer;

/**
  * @brief Timer to handle the application Join Led to toggle
  */
static UTIL_TIMER_Object_t JoinLedTimer;

/* USER CODE BEGIN PV */

/* USER CODE END PV */

/* Exported functions ---------------------------------------------------------*/
/* USER CODE BEGIN EF */

/* USER CODE END EF */

void LoRaWAN_Init(void)
{
  /* USER CODE BEGIN LoRaWAN_Init_1 */

  /* USER CODE END LoRaWAN_Init_1 */
#if defined(USE_BSP_DRIVER)
  BSP_LED_Init(LED_BLUE);
  BSP_LED_Init(LED_GREEN);
  BSP_LED_Init(LED_RED);
  BSP_PB_Init(BUTTON_SW2, BUTTON_MODE_EXTI);
#elif defined(MX_BOARD_PSEUDODRIVER)
  SYS_LED_Init(SYS_LED_BLUE);
  SYS_LED_Init(SYS_LED_GREEN);
  SYS_LED_Init(SYS_LED_RED);
  SYS_PB_Init(SYS_BUTTON2, SYS_BUTTON_MODE_EXTI);
#else
#error user to provide its board code or to call his board driver functions
#endif  /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */

  /* Get LoRa APP version*/
  APP_LOG(TS_OFF, VLEVEL_M, "APP_VERSION:        V%X.%X.%X\r\n",
          (uint8_t)(__LORA_APP_VERSION >> __APP_VERSION_MAIN_SHIFT),
          (uint8_t)(__LORA_APP_VERSION >> __APP_VERSION_SUB1_SHIFT),
          (uint8_t)(__LORA_APP_VERSION >> __APP_VERSION_SUB2_SHIFT));

  /* Get MW LoraWAN info */
  APP_LOG(TS_OFF, VLEVEL_M, "MW_LORAWAN_VERSION: V%X.%X.%X\r\n",
          (uint8_t)(__LORAWAN_VERSION >> __APP_VERSION_MAIN_SHIFT),
          (uint8_t)(__LORAWAN_VERSION >> __APP_VERSION_SUB1_SHIFT),
          (uint8_t)(__LORAWAN_VERSION >> __APP_VERSION_SUB2_SHIFT));

  /* Get MW SubGhz_Phy info */
  APP_LOG(TS_OFF, VLEVEL_M, "MW_RADIO_VERSION:   V%X.%X.%X\r\n",
          (uint8_t)(__SUBGHZ_PHY_VERSION >> __APP_VERSION_MAIN_SHIFT),
          (uint8_t)(__SUBGHZ_PHY_VERSION >> __APP_VERSION_SUB1_SHIFT),
          (uint8_t)(__SUBGHZ_PHY_VERSION >> __APP_VERSION_SUB2_SHIFT));

  UTIL_TIMER_Create(&TxLedTimer, 0xFFFFFFFFU, UTIL_TIMER_ONESHOT, OnTxTimerLedEvent, NULL);
  UTIL_TIMER_Create(&RxLedTimer, 0xFFFFFFFFU, UTIL_TIMER_ONESHOT, OnRxTimerLedEvent, NULL);
  UTIL_TIMER_Create(&JoinLedTimer, 0xFFFFFFFFU, UTIL_TIMER_PERIODIC, OnJoinTimerLedEvent, NULL);
  UTIL_TIMER_SetPeriod(&TxLedTimer, 500);
  UTIL_TIMER_SetPeriod(&RxLedTimer, 500);
  UTIL_TIMER_SetPeriod(&JoinLedTimer, 500);

  UTIL_SEQ_RegTask((1 << CFG_SEQ_Task_LmHandlerProcess), UTIL_SEQ_RFU, LmHandlerProcess);
  UTIL_SEQ_RegTask((1 << CFG_SEQ_Task_LoRaSendOnTxTimerOrButtonEvent), UTIL_SEQ_RFU, SendTxData);
  /* Init Info table used by LmHandler*/
  LoraInfo_Init();

  /* Init the Lora Stack*/
  LmHandlerInit(&LmHandlerCallbacks);

  LmHandlerConfigure(&LmHandlerParams);

  UTIL_TIMER_Start(&JoinLedTimer);

  LmHandlerJoin(ActivationType);

  if (EventType == TX_ON_TIMER)
  {
    /* send every time timer elapses */
    UTIL_TIMER_Create(&TxTimer,  0xFFFFFFFFU, UTIL_TIMER_ONESHOT, OnTxTimerEvent, NULL);
    UTIL_TIMER_SetPeriod(&TxTimer,  APP_TX_DUTYCYCLE);
    UTIL_TIMER_Start(&TxTimer);
  }
  else
  {
    /* send every time button is pushed */
#if defined(USE_BSP_DRIVER)
    BSP_PB_Init(BUTTON_SW1, BUTTON_MODE_EXTI);
#elif defined(MX_BOARD_PSEUDODRIVER)
    SYS_PB_Init(SYS_BUTTON1, SYS_BUTTON_MODE_EXTI);
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */
  }

  /* USER CODE BEGIN LoRaWAN_Init_Last */

  /* USER CODE END LoRaWAN_Init_Last */
}

#if defined(USE_BSP_DRIVER)
void BSP_PB_Callback(Button_TypeDef Button)
{
#warning: adapt stm32wlxx_it.c to call BSP_PB_IRQHandler if you want to use BSP
  /* USER CODE BEGIN BSP_PB_Callback_1 */

  /* USER CODE END BSP_PB_Callback_1 */
  switch (Button)
  {
    case  BUTTON_SW1:
      UTIL_SEQ_SetTask((1 << CFG_SEQ_Task_LoRaSendOnTxTimerOrButtonEvent), CFG_SEQ_Prio_0);
      /* USER CODE BEGIN PB_Callback 1 */
      /* USER CODE END PB_Callback 1 */
      break;
    case  BUTTON_SW2:
      /* USER CODE BEGIN PB_Callback 2 */
      /* USER CODE END PB_Callback 2 */
      break;
    case  BUTTON_SW3:
      /* USER CODE BEGIN PB_Callback 3 */
      /* USER CODE END PB_Callback 3 */
      break;
    default:
      break;
  }
  /* USER CODE BEGIN BSP_PB_Callback_Last */

  /* USER CODE END BSP_PB_Callback_Last */
}

#elif defined(MX_BOARD_PSEUDODRIVER)

/* Note: Current MX does not support EXTI IP neither BSP. */
/* In order to get a push button IRS by code automatically generated */
/* this function is today the only available possibility. */
/* Calling BSP_PB_Callback() from here it shortcuts the BSP. */
/* If users wants to go through the BSP, it can remove BSP_PB_Callback() from here */
/* and add a call to BSP_PB_IRQHandler() in the USER CODE SESSION of the */
/* correspondent EXTIn_IRQHandler() in the stm32wlxx_it.c */
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
  /* USER CODE BEGIN HAL_GPIO_EXTI_Callback_1 */

  /* USER CODE END HAL_GPIO_EXTI_Callback_1 */
  switch (GPIO_Pin)
  {
    case  SYS_BUTTON1_PIN:
      /* Note: when "EventType == TX_ON_TIMER" this GPIO is not initialised */
      UTIL_SEQ_SetTask((1 << CFG_SEQ_Task_LoRaSendOnTxTimerOrButtonEvent), CFG_SEQ_Prio_0);
      /* USER CODE BEGIN EXTI_Callback_Switch_B1 */
      /* USER CODE END EXTI_Callback_Switch_B1 */
      break;
    case  SYS_BUTTON2_PIN:
      /* USER CODE BEGIN EXTI_Callback_Switch_B2 */
      /* USER CODE END EXTI_Callback_Switch_B2 */
      break;
    /* USER CODE BEGIN EXTI_Callback_Switch_case */

    /* USER CODE END EXTI_Callback_Switch_case */
    default:
    /* USER CODE BEGIN EXTI_Callback_Switch_default */
    /* USER CODE END EXTI_Callback_Switch_default */
      break;
  }
  /* USER CODE BEGIN HAL_GPIO_EXTI_Callback_Last */

  /* USER CODE END HAL_GPIO_EXTI_Callback_Last */
}
#else
#error user to provide its board code or to call his board driver functions
#endif  /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER*/

/* Private functions ---------------------------------------------------------*/
/* USER CODE BEGIN PrFD */

/* USER CODE END PrFD */

static void OnRxData(LmHandlerAppData_t *appData, LmHandlerRxParams_t *params)
{
  /* USER CODE BEGIN OnRxData_1 */

  /* USER CODE END OnRxData_1 */
  if ((appData != NULL) && (params != NULL))
  {
#if defined(USE_BSP_DRIVER)
    BSP_LED_On(LED_BLUE) ;
#elif defined(MX_BOARD_PSEUDODRIVER)
    SYS_LED_On(SYS_LED_BLUE) ;
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */
    UTIL_TIMER_Start(&RxLedTimer);

    static const char *slotStrings[] = { "1", "2", "C", "C Multicast", "B Ping-Slot", "B Multicast Ping-Slot" };

    APP_LOG(TS_OFF, VLEVEL_M, "\r\n###### ========== MCPS-Indication ==========\r\n");
    APP_LOG(TS_OFF, VLEVEL_H, "###### D/L FRAME:%04d | SLOT:%s | PORT:%d | DR:%d | RSSI:%d | SNR:%d\r\n",
            params->DownlinkCounter, slotStrings[params->RxSlot], appData->Port, params->Datarate, params->Rssi, params->Snr);
    switch (appData->Port)
    {
      case LORAWAN_SWITCH_CLASS_PORT:
        /*this port switches the class*/
        if (appData->BufferSize == 1)
        {
          switch (appData->Buffer[0])
          {
            case 0:
            {
              LmHandlerRequestClass(CLASS_A);
              break;
            }
            case 1:
            {
              LmHandlerRequestClass(CLASS_B);
              break;
            }
            case 2:
            {
              LmHandlerRequestClass(CLASS_C);
              break;
            }
            default:
              break;
          }
        }
        break;
      case LORAWAN_USER_APP_PORT:
        if (appData->BufferSize == 1)
        {
          AppLedStateOn = appData->Buffer[0] & 0x01;
          if (AppLedStateOn == RESET)
          {
            APP_LOG(TS_OFF, VLEVEL_H,   "LED OFF\r\n");

#if defined(USE_BSP_DRIVER)
            BSP_LED_Off(LED_RED) ;
#elif defined(MX_BOARD_PSEUDODRIVER)
            SYS_LED_Off(SYS_LED_RED) ;
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */
          }
          else
          {
            APP_LOG(TS_OFF, VLEVEL_H, "LED ON\r\n");
#if defined(USE_BSP_DRIVER)
            BSP_LED_On(LED_RED) ;
#elif defined(MX_BOARD_PSEUDODRIVER)
            SYS_LED_On(SYS_LED_RED) ;
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */
          }
        }
        break;
    /* USER CODE BEGIN OnRxData_Switch_case */

    /* USER CODE END OnRxData_Switch_case */
      default:
    /* USER CODE BEGIN OnRxData_Switch_default */

    /* USER CODE END OnRxData_Switch_default */
        break;
    }
  }

  /* USER CODE BEGIN OnRxData_2 */

  /* USER CODE END OnRxData_2 */
}
/**
 * @brief Send sensor data via LoRaWAN
 * Reads all sensors (Environmental, pH, TDS, AMG8833) and transmits via LoRaWAN
 */
static void SendTxData(void)
{
  sensor_t sensor_data;
  UTIL_TIMER_Time_t nextTxIn = 0;

  // Variables for thermal data
  float min_temp = 0.0f;
  float max_temp = 0.0f;
  float avg_temp = 0.0f;

  // Buffer for compressed thermal image data (64 bytes for 8-bit compression)
  uint8_t thermal_image_data[64];
  int thermal_data_size = 0;

  // Static sensor values only
  float static_water_temp = 20.0f;      // DS18B20 water temperature (°C)
  float static_ph_value = 7.2f;         // Static pH value
  float static_tds_value = 150.0f;      // Static TDS value (ppm)

  // GPS coordinates (Tunisia)
  float gps_latitude = 36.7461f;        // Latitude (°N)
  float gps_longitude = 10.4231f;       // Longitude (°E)

  /*** Environmental Sensors Reading ***/
  // Read environmental sensor data
  EnvSensors_Read(&sensor_data);

  /*** AMG8833 Thermal Camera Operation ***/
  // Activate AMG8833 thermal camera
  HAL_StatusTypeDef status = AMG8833_WakeUp();
  if (status != HAL_OK) {
    APP_LOG(TS_ON, VLEVEL_L, "Error waking up AMG8833: %d\r\n", status);
  }

  // Check if device is responding
  status = HAL_I2C_IsDeviceReady(&hi2c2, AMG8833_ADDR, 2, 100);
  if (status != HAL_OK) {
    APP_LOG(TS_ON, VLEVEL_L, "AMG8833 not responding on I2C2: %d\r\n", status);
  } else {
    APP_LOG(TS_ON, VLEVEL_L, "AMG8833 device ready on I2C2\r\n");

    HAL_Delay(100); // Give the sensor time to stabilize

    // Read AMG8833 thermal data
    status = AMG8833_ReadPixels();
    if (status != HAL_OK) {
      APP_LOG(TS_ON, VLEVEL_L, "Error reading AMG8833 data: %d\r\n", status);
    } else {
      APP_LOG(TS_ON, VLEVEL_L, "AMG8833 data read successfully\r\n");

      // Get thermal camera statistics
      AMG8833_GetStats(&min_temp, &max_temp, &avg_temp);

      // Prepare thermal image data for transmission
      thermal_data_size = AMG8833_PrepareChirpStackData(thermal_image_data, sizeof(thermal_image_data));
      if (thermal_data_size <= 0) {
        APP_LOG(TS_ON, VLEVEL_L, "Error preparing thermal image data\r\n");
      } else {
        APP_LOG(TS_ON, VLEVEL_L, "Thermal image data prepared: %d bytes\r\n", thermal_data_size);
      }
    }
  }

  // Put AMG8833 back to sleep to save power
  AMG8833_Sleep();

  /*** Logging Data for Debug ***/
  APP_LOG(TS_ON, VLEVEL_L, "=== Water Quality Sensor Data ===\r\n");

  // Log environmental sensor data
  APP_LOG(TS_ON, VLEVEL_L, "Temperature: %d C\r\n", (uint16_t)(sensor_data.temperature));
  APP_LOG(TS_ON, VLEVEL_L, "Pressure: %d hPa\r\n", (uint16_t)(sensor_data.pressure));
  APP_LOG(TS_ON, VLEVEL_L, "Humidity: %d%%\r\n", (uint16_t)(sensor_data.humidity));

  // Log static sensor data only
  APP_LOG(TS_ON, VLEVEL_L, "Water Temp (DS18B20): %d.%d C\r\n",
          (int16_t)static_water_temp, (int16_t)(static_water_temp * 10) % 10);
  APP_LOG(TS_ON, VLEVEL_L, "pH Value: %d.%d\r\n",
          (int16_t)static_ph_value, (int16_t)(static_ph_value * 10) % 10);
  APP_LOG(TS_ON, VLEVEL_L, "TDS Value: %d.%d ppm (Good)\r\n",
          (int16_t)static_tds_value, (int16_t)(static_tds_value * 10) % 10);
  APP_LOG(TS_ON, VLEVEL_L, "GPS Location: %d.%04d N, %d.%04d E\r\n",
          (int16_t)gps_latitude, (int16_t)((gps_latitude - (int16_t)gps_latitude) * 10000),
          (int16_t)gps_longitude, (int16_t)((gps_longitude - (int16_t)gps_longitude) * 10000));

  // Log thermal data only if available
  if (avg_temp > 0.0f) {
    APP_LOG(TS_ON, VLEVEL_L, "Thermal Min: %d.%d C\r\n",
            (int16_t)(min_temp * 10) / 10, abs((int16_t)(min_temp * 10) % 10));
    APP_LOG(TS_ON, VLEVEL_L, "Thermal Max: %d.%d C\r\n",
            (int16_t)(max_temp * 10) / 10, abs((int16_t)(max_temp * 10) % 10));
    APP_LOG(TS_ON, VLEVEL_L, "Thermal Avg: %d.%d C\r\n",
            (int16_t)(avg_temp * 10) / 10, abs((int16_t)(avg_temp * 10) % 10));
  }

  /*** LoRaWAN Data Preparation and Transmission ***/
  AppData.Port = LORAWAN_USER_APP_PORT;

  // Determine packet transmission strategy based on region
  bool send_full_image = false;
  bool send_compact_payload = false;

  // Check region for payload size limitations
  if ((LmHandlerParams.ActiveRegion == LORAMAC_REGION_US915) ||
      (LmHandlerParams.ActiveRegion == LORAMAC_REGION_AU915) ||
      (LmHandlerParams.ActiveRegion == LORAMAC_REGION_AS923)) {
    send_compact_payload = true;
    APP_LOG(TS_ON, VLEVEL_L, "Using compact payload for region restrictions\r\n");
  } else {
    send_full_image = true;
    APP_LOG(TS_ON, VLEVEL_L, "Using full payload with thermal image\r\n");
  }

  // Reset Cayenne LPP buffer
  CayenneLppReset();

  /*** Standard Environmental Data (Always Included) ***/
  // Channels 1-3: Environmental sensors
  CayenneLppAddBarometricPressure(1, (uint16_t)(sensor_data.pressure));
  CayenneLppAddTemperature(2, (uint16_t)(sensor_data.temperature));
  CayenneLppAddRelativeHumidity(3, (uint16_t)(sensor_data.humidity));

  /*** Static Sensor Data (Primary Data) ***/
  // Channel 4: Water temperature (static DS18B20 value)
  CayenneLppAddTemperature(4, (uint16_t)(static_water_temp * 10));

  // Channel 5: pH value (static)
  CayenneLppAddAnalogInput(5, static_ph_value);

  // Channel 6: TDS value (static)
  CayenneLppAddAnalogInput(6, static_tds_value);

  /*** GPS Coordinates ***/
  // Channel 7: GPS Latitude
  CayenneLppAddAnalogInput(7, gps_latitude);

  // Channel 8: GPS Longitude
  CayenneLppAddAnalogInput(8, gps_longitude);

  /*** Extended Data ***/
  if (!send_compact_payload) {
    // Water quality classification based on static TDS value
    uint8_t water_quality_code = 1; // Good (TDS = 150ppm)
    CayenneLppAddDigitalInput(9, water_quality_code);

    // Thermal data
    if (avg_temp > 0.0f) {
      CayenneLppAddTemperature(10, (int16_t)((min_temp + 100.0f) * 10.0f));
      CayenneLppAddTemperature(11, (int16_t)((max_temp + 100.0f) * 10.0f));
      CayenneLppAddTemperature(12, (int16_t)((avg_temp + 100.0f) * 10.0f));
    }

    // Add thermal image data if available
    if (thermal_data_size > 0 && send_full_image) {
      // Channels 20-21: Thermal image metadata
      CayenneLppAddDigitalInput(20, 8);  // Width
      CayenneLppAddDigitalInput(21, 8);  // Height

      // Channels 30-93: Compressed pixel data
      int pixels_to_send = (thermal_data_size < 64) ? thermal_data_size : 64;
      for (int i = 0; i < pixels_to_send; i++) {
        CayenneLppAddDigitalInput(30 + i, thermal_image_data[i]);
      }
    }
  } else {
    /*** Compact Payload Mode ***/
    // Only send essential data
    uint8_t water_quality_code = 1; // Good (based on static TDS = 150ppm)
    CayenneLppAddDigitalInput(18, water_quality_code);

    // Thermal average if available
    if (avg_temp > 0.0f) {
      CayenneLppAddTemperature(19, (int16_t)((avg_temp + 100.0f) * 10.0f));
    }
  }

  // Copy formatted data to AppData buffer
  CayenneLppCopy(AppData.Buffer);
  AppData.BufferSize = CayenneLppGetSize();

  APP_LOG(TS_ON, VLEVEL_L, "Total payload size: %d bytes\r\n", AppData.BufferSize);

  // Attempt to send data via LoRaWAN
  if (LORAMAC_HANDLER_SUCCESS == LmHandlerSend(&AppData, LORAWAN_DEFAULT_CONFIRMED_MSG_STATE, &nextTxIn, false))
  {
    APP_LOG(TS_ON, VLEVEL_L, "SEND REQUEST SUCCESS\r\n");
  }
  else if (nextTxIn > 0)
  {
    APP_LOG(TS_ON, VLEVEL_L, "Next Tx in: ~%d second(s)\r\n", (nextTxIn / 1000));
  }
  else
  {
    APP_LOG(TS_ON, VLEVEL_L, "SEND REQUEST FAILED\r\n");
  }
}
static void OnTxTimerEvent(void *context)
{
  /* USER CODE BEGIN OnTxTimerEvent_1 */

  /* USER CODE END OnTxTimerEvent_1 */
  UTIL_SEQ_SetTask((1 << CFG_SEQ_Task_LoRaSendOnTxTimerOrButtonEvent), CFG_SEQ_Prio_0);

  /*Wait for next tx slot*/
  UTIL_TIMER_Start(&TxTimer);
  /* USER CODE BEGIN OnTxTimerEvent_2 */

  /* USER CODE END OnTxTimerEvent_2 */
}

static void OnTxTimerLedEvent(void *context)
{
  /* USER CODE BEGIN OnTxTimerLedEvent_1 */

  /* USER CODE END OnTxTimerLedEvent_1 */
#if defined(USE_BSP_DRIVER)
  BSP_LED_Off(LED_GREEN) ;
#else
  SYS_LED_Off(SYS_LED_GREEN) ;
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */
  /* USER CODE BEGIN OnTxTimerLedEvent_2 */

  /* USER CODE END OnTxTimerLedEvent_2 */
}

static void OnRxTimerLedEvent(void *context)
{
  /* USER CODE BEGIN OnRxTimerLedEvent_1 */

  /* USER CODE END OnRxTimerLedEvent_1 */
#if defined(USE_BSP_DRIVER)
  BSP_LED_Off(LED_BLUE) ;
#else
  SYS_LED_Off(SYS_LED_BLUE) ;
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */
  /* USER CODE BEGIN OnRxTimerLedEvent_2 */

  /* USER CODE END OnRxTimerLedEvent_2 */
}

static void OnJoinTimerLedEvent(void *context)
{
  /* USER CODE BEGIN OnJoinTimerLedEvent_1 */

  /* USER CODE END OnJoinTimerLedEvent_1 */
#if defined(USE_BSP_DRIVER)
  BSP_LED_Toggle(LED_RED) ;
#else
  SYS_LED_Toggle(SYS_LED_RED) ;
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */
  /* USER CODE BEGIN OnJoinTimerLedEvent_2 */

  /* USER CODE END OnJoinTimerLedEvent_2 */
}

static void OnTxData(LmHandlerTxParams_t *params)
{
  /* USER CODE BEGIN OnTxData_1 */

  /* USER CODE END OnTxData_1 */
  if ((params != NULL) && (params->IsMcpsConfirm != 0))
  {
#if defined(USE_BSP_DRIVER)
    BSP_LED_On(LED_GREEN) ;
#elif defined(MX_BOARD_PSEUDODRIVER)
    SYS_LED_On(SYS_LED_GREEN) ;
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */
    UTIL_TIMER_Start(&TxLedTimer);

    APP_LOG(TS_OFF, VLEVEL_M, "\r\n###### ========== MCPS-Confirm =============\r\n");
    APP_LOG(TS_OFF, VLEVEL_H, "###### U/L FRAME:%04d | PORT:%d | DR:%d | PWR:%d", params->UplinkCounter,
            params->AppData.Port, params->Datarate, params->TxPower);

    APP_LOG(TS_OFF, VLEVEL_H, " | MSG TYPE:");
    if (params->MsgType == LORAMAC_HANDLER_CONFIRMED_MSG)
    {
      APP_LOG(TS_OFF, VLEVEL_H, "CONFIRMED [%s]\r\n", (params->AckReceived != 0) ? "ACK" : "NACK");
    }
    else
    {
      APP_LOG(TS_OFF, VLEVEL_H, "UNCONFIRMED\r\n");
    }
  }

  /* USER CODE BEGIN OnTxData_2 */

  /* USER CODE END OnTxData_2 */
}

static void OnJoinRequest(LmHandlerJoinParams_t *joinParams)
{
  /* USER CODE BEGIN OnJoinRequest_1 */

  /* USER CODE END OnJoinRequest_1 */
  if (joinParams != NULL)
  {
    if (joinParams->Status == LORAMAC_HANDLER_SUCCESS)
    {
      UTIL_TIMER_Stop(&JoinLedTimer);

#if defined(USE_BSP_DRIVER)
      BSP_LED_Off(LED_RED) ;
#elif defined(MX_BOARD_PSEUDODRIVER)
      SYS_LED_Off(SYS_LED_RED) ;
#endif /* USE_BSP_DRIVER || MX_BOARD_PSEUDODRIVER */

      APP_LOG(TS_OFF, VLEVEL_M, "\r\n###### = JOINED = ");
      if (joinParams->Mode == ACTIVATION_TYPE_ABP)
      {
        APP_LOG(TS_OFF, VLEVEL_M, "ABP ======================\r\n");
      }
      else
      {
        APP_LOG(TS_OFF, VLEVEL_M, "OTAA =====================\r\n");
      }
    }
    else
    {
      APP_LOG(TS_OFF, VLEVEL_M, "\r\n###### = JOIN FAILED\r\n");
    }
  }

  /* USER CODE BEGIN OnJoinRequest_2 */

  /* USER CODE END OnJoinRequest_2 */
}

static void OnMacProcessNotify(void)
{
  /* USER CODE BEGIN OnMacProcessNotify_1 */

  /* USER CODE END OnMacProcessNotify_1 */
  UTIL_SEQ_SetTask((1 << CFG_SEQ_Task_LmHandlerProcess), CFG_SEQ_Prio_0);
  /* USER CODE BEGIN OnMacProcessNotify_2 */

  /* USER CODE END OnMacProcessNotify_2 */
}

/************************ (C) COPYRIGHT STMicroelectronics *****END OF FILE****/
