################################################################################
# Automatically-generated file. Do not edit!
# Toolchain: GNU Tools for STM32 (12.3.rel1)
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../Drivers/BSP/IKS01A2/iks01a2_env_sensors.c \
../Drivers/BSP/IKS01A2/iks01a2_env_sensors_ex.c \
../Drivers/BSP/IKS01A2/iks01a2_motion_sensors.c \
../Drivers/BSP/IKS01A2/iks01a2_motion_sensors_ex.c 

OBJS += \
./Drivers/BSP/IKS01A2/iks01a2_env_sensors.o \
./Drivers/BSP/IKS01A2/iks01a2_env_sensors_ex.o \
./Drivers/BSP/IKS01A2/iks01a2_motion_sensors.o \
./Drivers/BSP/IKS01A2/iks01a2_motion_sensors_ex.o 

C_DEPS += \
./Drivers/BSP/IKS01A2/iks01a2_env_sensors.d \
./Drivers/BSP/IKS01A2/iks01a2_env_sensors_ex.d \
./Drivers/BSP/IKS01A2/iks01a2_motion_sensors.d \
./Drivers/BSP/IKS01A2/iks01a2_motion_sensors_ex.d 


# Each subdirectory must supply rules for building sources it contributes
Drivers/BSP/IKS01A2/%.o Drivers/BSP/IKS01A2/%.su Drivers/BSP/IKS01A2/%.cyclo: ../Drivers/BSP/IKS01A2/%.c Drivers/BSP/IKS01A2/subdir.mk
	arm-none-eabi-gcc "$<" -mcpu=cortex-m4 -std=gnu11 -g3 -DDEBUG -DCORE_CM4 -DUSE_HAL_DRIVER -DSTM32WL55xx -DX_NUCLEO_IKS01A2 -c -I../Core/Inc -I../luminosity/ -I../LoRaWAN/App -I../LoRaWAN/Target -I../Drivers/STM32WLxx_HAL_Driver/Inc -I../Drivers/STM32WLxx_HAL_Driver/Inc/Legacy -I../Utilities/trace/adv_trace -I../Utilities/misc -I../Utilities/sequencer -I../Utilities/timer -I../Utilities/lpm/tiny_lpm -I../Middlewares/Third_Party/LoRaWAN/LmHandler/Packages -I../Middlewares/Third_Party/SubGHz_Phy -I../Middlewares/Third_Party/SubGHz_Phy/stm32_radio_driver -I../Drivers/CMSIS/Device/ST/STM32WLxx/Include -I../Middlewares/Third_Party/LoRaWAN/Crypto -I../Middlewares/Third_Party/LoRaWAN/Mac/Region -I../Middlewares/Third_Party/LoRaWAN/Mac -I../Middlewares/Third_Party/LoRaWAN/LmHandler -I../Middlewares/Third_Party/LoRaWAN/Utilities -I../Drivers/CMSIS/Include -I../X-CUBE-MEMS1/Target -I../Drivers/BSP/Components/lsm6dsl -I../Drivers/BSP/Components/lsm303agr -I../Drivers/BSP/Components/hts221 -I../Drivers/BSP/Components/lps22hb -I../Drivers/BSP/IKS01A2 -I../Drivers/BSP/Components/Common -I../AMG8833/ -I../PH/ -I../TDS/ -I../Water_Temperature/ -O0 -ffunction-sections -fdata-sections -Wall -fstack-usage -fcyclomatic-complexity -MMD -MP -MF"$(@:%.o=%.d)" -MT"$@" --specs=nano.specs -mfloat-abi=soft -mthumb -o "$@"

clean: clean-Drivers-2f-BSP-2f-IKS01A2

clean-Drivers-2f-BSP-2f-IKS01A2:
	-$(RM) ./Drivers/BSP/IKS01A2/iks01a2_env_sensors.cyclo ./Drivers/BSP/IKS01A2/iks01a2_env_sensors.d ./Drivers/BSP/IKS01A2/iks01a2_env_sensors.o ./Drivers/BSP/IKS01A2/iks01a2_env_sensors.su ./Drivers/BSP/IKS01A2/iks01a2_env_sensors_ex.cyclo ./Drivers/BSP/IKS01A2/iks01a2_env_sensors_ex.d ./Drivers/BSP/IKS01A2/iks01a2_env_sensors_ex.o ./Drivers/BSP/IKS01A2/iks01a2_env_sensors_ex.su ./Drivers/BSP/IKS01A2/iks01a2_motion_sensors.cyclo ./Drivers/BSP/IKS01A2/iks01a2_motion_sensors.d ./Drivers/BSP/IKS01A2/iks01a2_motion_sensors.o ./Drivers/BSP/IKS01A2/iks01a2_motion_sensors.su ./Drivers/BSP/IKS01A2/iks01a2_motion_sensors_ex.cyclo ./Drivers/BSP/IKS01A2/iks01a2_motion_sensors_ex.d ./Drivers/BSP/IKS01A2/iks01a2_motion_sensors_ex.o ./Drivers/BSP/IKS01A2/iks01a2_motion_sensors_ex.su

.PHONY: clean-Drivers-2f-BSP-2f-IKS01A2

