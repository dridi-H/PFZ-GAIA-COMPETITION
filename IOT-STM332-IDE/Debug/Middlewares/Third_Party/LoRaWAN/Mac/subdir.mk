################################################################################
# Automatically-generated file. Do not edit!
# Toolchain: GNU Tools for STM32 (12.3.rel1)
################################################################################

# Add inputs and outputs from these tool invocations to the build variables 
C_SRCS += \
../Middlewares/Third_Party/LoRaWAN/Mac/LoRaMac.c \
../Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacAdr.c \
../Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacClassB.c \
../Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCommands.c \
../Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacConfirmQueue.c \
../Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCrypto.c \
../Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacParser.c \
../Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacSerializer.c 

OBJS += \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMac.o \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacAdr.o \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacClassB.o \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCommands.o \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacConfirmQueue.o \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCrypto.o \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacParser.o \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacSerializer.o 

C_DEPS += \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMac.d \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacAdr.d \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacClassB.d \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCommands.d \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacConfirmQueue.d \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCrypto.d \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacParser.d \
./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacSerializer.d 


# Each subdirectory must supply rules for building sources it contributes
Middlewares/Third_Party/LoRaWAN/Mac/%.o Middlewares/Third_Party/LoRaWAN/Mac/%.su Middlewares/Third_Party/LoRaWAN/Mac/%.cyclo: ../Middlewares/Third_Party/LoRaWAN/Mac/%.c Middlewares/Third_Party/LoRaWAN/Mac/subdir.mk
	arm-none-eabi-gcc "$<" -mcpu=cortex-m4 -std=gnu11 -g3 -DDEBUG -DCORE_CM4 -DUSE_HAL_DRIVER -DSTM32WL55xx -DX_NUCLEO_IKS01A2 -c -I../Core/Inc -I../luminosity/ -I../LoRaWAN/App -I../LoRaWAN/Target -I../Drivers/STM32WLxx_HAL_Driver/Inc -I../Drivers/STM32WLxx_HAL_Driver/Inc/Legacy -I../Utilities/trace/adv_trace -I../Utilities/misc -I../Utilities/sequencer -I../Utilities/timer -I../Utilities/lpm/tiny_lpm -I../Middlewares/Third_Party/LoRaWAN/LmHandler/Packages -I../Middlewares/Third_Party/SubGHz_Phy -I../Middlewares/Third_Party/SubGHz_Phy/stm32_radio_driver -I../Drivers/CMSIS/Device/ST/STM32WLxx/Include -I../Middlewares/Third_Party/LoRaWAN/Crypto -I../Middlewares/Third_Party/LoRaWAN/Mac/Region -I../Middlewares/Third_Party/LoRaWAN/Mac -I../Middlewares/Third_Party/LoRaWAN/LmHandler -I../Middlewares/Third_Party/LoRaWAN/Utilities -I../Drivers/CMSIS/Include -I../X-CUBE-MEMS1/Target -I../Drivers/BSP/Components/lsm6dsl -I../Drivers/BSP/Components/lsm303agr -I../Drivers/BSP/Components/hts221 -I../Drivers/BSP/Components/lps22hb -I../Drivers/BSP/IKS01A2 -I../Drivers/BSP/Components/Common -I../AMG8833/ -I../PH/ -I../TDS/ -I../Water_Temperature/ -O0 -ffunction-sections -fdata-sections -Wall -fstack-usage -fcyclomatic-complexity -MMD -MP -MF"$(@:%.o=%.d)" -MT"$@" --specs=nano.specs -mfloat-abi=soft -mthumb -o "$@"

clean: clean-Middlewares-2f-Third_Party-2f-LoRaWAN-2f-Mac

clean-Middlewares-2f-Third_Party-2f-LoRaWAN-2f-Mac:
	-$(RM) ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMac.cyclo ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMac.d ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMac.o ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMac.su ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacAdr.cyclo ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacAdr.d ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacAdr.o ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacAdr.su ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacClassB.cyclo ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacClassB.d ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacClassB.o ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacClassB.su ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCommands.cyclo ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCommands.d ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCommands.o ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCommands.su ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacConfirmQueue.cyclo ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacConfirmQueue.d ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacConfirmQueue.o ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacConfirmQueue.su ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCrypto.cyclo ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCrypto.d ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCrypto.o ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacCrypto.su ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacParser.cyclo ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacParser.d ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacParser.o ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacParser.su ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacSerializer.cyclo ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacSerializer.d ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacSerializer.o ./Middlewares/Third_Party/LoRaWAN/Mac/LoRaMacSerializer.su

.PHONY: clean-Middlewares-2f-Third_Party-2f-LoRaWAN-2f-Mac

