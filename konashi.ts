type KonCharacteristics =
  | "pioSetting"
  | "pioPullUp"
  | "pioOutput"
  | "pioInputNotification"
  | "pwmConfig"
  | "pwmParameter"
  | "pwmDuty"
  | "analogDrive"
  | "analogInput"
  | "analogRead0"
  | "analogRead1"
  | "analogRead2"
  | "i2cConfig"
  | "i2cStartStop"
  | "i2cWrite"
  | "i2cReadParameter"
  | "i2cRead"
  | "uartConfig"
  | "uartBaudRate"
  | "uartTx"
  | "uartRxNotification"
  | "hardwareReset"
  | "hardwareLowBatteryNotification";

type CocCharacteristics =
  | "pioSetting"
  | "pioPullUp"
  | "pioOutput"
  | "pioInputNotification"
  | "pwmConfig"
  | "pwmParameter"
  | "pwmDuty"
  | "hardPwmConfig"
  | "hardPwmDuty"
  | "hardPwmDutyAll"
  | "hardPwmDutyTime"
  | "softwareReset"
  | "hardwareReset"
  | "hardwareLowBatteryNotification";

type Characteristics = KonCharacteristics | CocCharacteristics;

export class Konashi {
  private _dev: Konashi.DEV;
  private _device: BluetoothDevice;
  private _gatt?: BluetoothRemoteGATTServer;
  private _service?: BluetoothRemoteGATTService;
  private _c12c: Record<Characteristics, BluetoothRemoteGATTCharacteristic>;
  private _pioOutputs: number;
  onReceived: (event: any) => void;

  static _createUUID(part: string): BluetoothCharacteristicUUID {
    return `229b${part}-03fb-40da-98a7-b0def65c2d4b`;
  }

  static get _serviceUUID() {
    return Konashi._createUUID("ff00");
  }

  static get defaultFilter(): RequestDeviceOptions {
    return {
      filters: [
        {
          namePrefix: "konashi",
        },
      ],
      optionalServices: [Konashi._serviceUUID],
    };
  }

  static async find(
    options = Konashi.defaultFilter,
    dev = Konashi.DEV.KONASHI
  ) {
    const device = await navigator.bluetooth.requestDevice(options);
    const k = new Konashi(device, dev);

    return k;
  }

  constructor(device: BluetoothDevice, dev = Konashi.DEV.KONASHI) {
    this._dev = dev;
    this._device = device;
    this._c12c = {} as Record<
      Characteristics,
      BluetoothRemoteGATTCharacteristic
    >;
    this._pioOutputs = 0;
    // TODO: Better init
    this.onReceived = () => {};
  }

  get _c12cUUIDs() {
    return this._dev === Konashi.DEV.COCORO
      ? {
          pioSetting: Konashi._createUUID("3000"),
          pioPullUp: Konashi._createUUID("3001"),
          pioOutput: Konashi._createUUID("3002"),
          pioInputNotification: Konashi._createUUID("3003"),
          pwmConfig: Konashi._createUUID("3004"),
          pwmParameter: Konashi._createUUID("3005"),
          pwmDuty: Konashi._createUUID("3006"),
          hardPwmConfig: Konashi._createUUID("3007"),
          hardPwmDuty: Konashi._createUUID("3008"),
          hardPwmDutyAll: Konashi._createUUID("3009"),
          hardPwmDutyTime: Konashi._createUUID("3010"),
          softwareReset: Konashi._createUUID("3013"),
          hardwareReset: Konashi._createUUID("3014"),
          hardwareLowBatteryNotification: Konashi._createUUID("3015"),
        }
      : {
          pioSetting: Konashi._createUUID("3000"),
          pioPullUp: Konashi._createUUID("3001"),
          pioOutput: Konashi._createUUID("3002"),
          pioInputNotification: Konashi._createUUID("3003"),
          pwmConfig: Konashi._createUUID("3004"),
          pwmParameter: Konashi._createUUID("3005"),
          pwmDuty: Konashi._createUUID("3006"),
          analogDrive: Konashi._createUUID("3007"),
          analogInput: Konashi._createUUID("3008"),
          analogRead0: Konashi._createUUID("3008"),
          analogRead1: Konashi._createUUID("3009"),
          analogRead2: Konashi._createUUID("300a"),
          i2cConfig: Konashi._createUUID("300b"),
          i2cStartStop: Konashi._createUUID("300c"),
          i2cWrite: Konashi._createUUID("300d"),
          i2cReadParameter: Konashi._createUUID("300e"),
          i2cRead: Konashi._createUUID("300f"),
          uartConfig: Konashi._createUUID("3010"),
          uartBaudRate: Konashi._createUUID("3011"),
          uartTx: Konashi._createUUID("3012"),
          uartRxNotification: Konashi._createUUID("3013"),
          hardwareReset: Konashi._createUUID("3014"),
          hardwareLowBatteryNotification: Konashi._createUUID("3015"),
        };
  }

  async connect() {
    if (!this._device.gatt) return;

    this._gatt = await this._device.gatt.connect();
    this._service = await this._gatt.getPrimaryService(Konashi._serviceUUID);

    for (const uuid of Object.keys(this._c12cUUIDs)) {
      const characteristic = await this._service
        .getCharacteristic(this._c12cUUIDs[uuid as Characteristics]!)
        .catch((error) => {
          console.log(
            `No Characteristic for ${uuid} (${
              this._c12cUUIDs[uuid as Characteristics]
            }) found in Service.`
          );
        });
      if (characteristic) {
        this._c12c[uuid as Characteristics] = characteristic;
      }
    }
  }

  disconnect() {
    if (!this._gatt) return;

    this._gatt.disconnect();
  }

  get isConnected() {
    return !!this._gatt?.connected;
  }

  get deviceName() {
    return this._device.name;
  }

  // TODO: Type Pin Modes
  async pinMode(pin: Konashi.PINS, mode: number) {
    const value = await this._c12c.pioSetting.readValue();
    let modes = value.getUint8(0);

    if (mode === Konashi.OUTPUT) {
      modes |= 0x01 << pin;
    } else {
      modes &= ~(0x01 << pin) & 0xff;
    }

    await this._c12c.pioSetting.writeValue(new Uint8Array([modes]));
  }

  // TODO: Type Pin Modes
  async pinModeAll(modes: Uint8Array[0]) {
    if (modes >= 0x00 && modes <= 0xff) {
      await this._c12c.pioSetting.writeValue(new Uint8Array([modes]));
    }
  }

  async pinPullUp(
    pin: Konashi.PINS,
    mode: typeof Konashi.PULLUP | typeof Konashi.NO_PULLS
  ) {
    const value = await this._c12c.pioPullUp.readValue();

    let modes = value.getUint8(0);

    if (mode === Konashi.PULLUP) {
      modes |= 0x01 << pin;
    } else {
      modes &= ~(0x01 << pin) & 0xff;
    }

    await this._c12c.pioPullUp.writeValue(new Uint8Array([modes]));
  }

  async digitalWrite(pin: Konashi.PINS, value: Uint8Array[0]) {
    if (value === Konashi.HIGH) {
      this._pioOutputs |= 0x01 << pin;
    } else {
      this._pioOutputs &= ~(0x01 << pin) & 0xff;
    }
    await this._c12c.pioOutput.writeValue(new Uint8Array([this._pioOutputs]));
  }

  async digitalWriteAll(values: Uint8Array[0]) {
    if (values >= 0x00 && values <= 0xff) {
      await this._c12c.pioOutput.writeValue(new Uint8Array([values]));
    }
  }

  async digitalRead(pin: Konashi.PINS) {
    const value = await this._c12c.pioInputNotification.readValue();

    return (value.getUint8(0) >> pin) & 0x01;
  }

  async startDigitalInputNotification(callback: (value: number) => void) {
    // TODO: Fix this type
    this.onReceived = (event: any) => {
      const value = event.target.value;
      callback(value.getUint8(0));
    };

    await this._c12c.pioInputNotification.startNotifications();

    this._c12c.pioInputNotification.addEventListener(
      "characteristicvaluechanged",
      this.onReceived
    );
  }

  async stopDigitalInputNotification() {
    await this._c12c.pioInputNotification.stopNotifications();

    this._c12c.pioInputNotification.removeEventListener(
      "characteristicvaluechanged",
      this.onReceived
    );
  }

  /**
   * Read from analog pins. (This is not supported by Cocoro Kit)
   * @param pin {number}
   * @returns
   */
  async analogRead(
    pin: Konashi.PINS.AIO0 | Konashi.PINS.AIO1 | Konashi.PINS.AIO2
  ) {
    let characteristic;

    switch (pin) {
      case Konashi.PINS.AIO0:
        characteristic = this._c12c.analogRead0;
        break;
      case Konashi.PINS.AIO1:
        characteristic = this._c12c.analogRead1;
        break;
      case Konashi.PINS.AIO2:
        characteristic = this._c12c.analogRead2;
        break;
      default:
        return 0;
    }

    const value = await characteristic.readValue();

    return (value.getUint8(0) << 8) | value.getUint8(1);
  }

  /**
   * (This may not work with Cocoro Kit!)
   * @param pin
   * @param mode
   */
  async pwmMode(pin: Konashi.PINS, mode: Konashi.PWM_MODES) {
    if (!this._c12c.pwmConfig) {
      throw "pwmConfig is not defined on" + JSON.stringify(this._c12c);
    }

    const value = await this._c12c.pwmConfig.readValue();

    let modes = value.getUint8(0);

    if (
      mode === Konashi.PWM_MODES.ENABLE ||
      mode === Konashi.PWM_MODES.ENABLE_LED_MODE
    ) {
      modes |= 0x01 << pin;
    } else {
      modes &= ~(0x01 << pin) & 0xff;
    }

    if (mode === Konashi.PWM_MODES.ENABLE_LED_MODE) {
      await this._c12c.pwmConfig.writeValue(new Uint8Array([modes]));

      await this.pwmPeriod(pin, Konashi.PWM_LED_PERIOD);
      await this.pwmDuty(pin, 0);
    } else {
      await this._c12c.pwmConfig.writeValue(new Uint8Array([modes]));
    }
  }

  /**
   * Set the PWM period
   * @param pin
   * @param period
   */
  async pwmPeriod(pin: Konashi.PINS, period: number) {
    const data = new Uint8Array([
      pin,
      (period >> 24) & 0xff,
      (period >> 16) & 0xff,
      (period >> 8) & 0xff,
      (period >> 0) & 0xff,
    ]);

    await this._c12c.pwmParameter.writeValue(data);
  }

  /**
   * Set the PWM duty
   * @param {number} pin
   * @param {number} duty
   */
  async pwmDuty(pin: Konashi.PINS, duty: number | string) {
    const dutyNum = typeof duty === "string" ? parseInt(duty) : duty;
    const data = new Uint8Array([
      pin,
      (dutyNum >> 24) & 0xff,
      (dutyNum >> 16) & 0xff,
      (dutyNum >> 8) & 0xff,
      (dutyNum >> 0) & 0xff,
    ]);
    await this._c12c.pwmDuty.writeValue(data);
  }

  async pwmWrite(pin: Konashi.PINS, ratio: number) {
    const rate = Math.min(100.0, Math.max(0.0, ratio));
    const duty = (Konashi.PWM_LED_PERIOD * rate) / 100;
    await this.pwmDuty(pin, duty);
  }

  /**
   * (This is not supported by Konashi)
   * @param {*} modes 0x00-0x0F 0:Disable, 1:Enable
   */
  async hardPwmModeAll(modes: Uint8Array[0]) {
    if (modes >= 0x00 && modes <= 0x0f) {
      await this._c12c.hardPwmConfig.writeValue(new Uint8Array([modes]));
    }
  }

  /**
   * (This is not supported by Konashi)
   * @param {number} pin
   * @param {number} duty
   */
  async hardPwmDuty(pin: Konashi.PINS, duty: number) {
    var data = new Uint8Array([pin, (duty >> 8) & 0xff, (duty >> 0) & 0xff]);
    await this._c12c.hardPwmDuty.writeValue(data);
  }

  /**
   * (This is not supported by Konashi)
   * @param duties
   */
  async hardPwmDutyAll(duties: number[]) {
    const data = new Uint8Array([
      (duties[0] >> 8) & 0xff,
      (duties[0] >> 0) & 0xff,
      (duties[1] >> 8) & 0xff,
      (duties[1] >> 0) & 0xff,
      (duties[2] >> 8) & 0xff,
      (duties[2] >> 0) & 0xff,
      (duties[3] >> 8) & 0xff,
      (duties[3] >> 0) & 0xff,
    ]);

    await this._c12c.hardPwmDutyAll.writeValue(data);
  }

  /**
   * (This is not supported by Konashi)
   * @param pin
   * @param duty
   * @param duration
   */
  async hardPwmDutyTime(pin: Konashi.PINS, duty: number, duration: number) {
    var data = new Uint8Array([
      pin,
      (duty >> 8) & 0xff,
      (duty >> 0) & 0xff,
      (duration >> 8) & 0xff,
      (duration >> 0) & 0xff,
    ]);
    await this._c12c.hardPwmDutyTime.writeValue(data);
  }

  async uartMode(mode: Konashi.UART.DISABLE | Konashi.UART.DISABLE) {
    await this._c12c.uartConfig.writeValue(new Uint8Array([mode]));
  }

  async uartBaudRate(rate: Konashi.UART.RATE_2K4 | Konashi.UART.RATE_9K6) {
    const data = new Uint8Array([(rate >> 8) & 0xff, rate & 0xff]);
    await this._c12c.uartBaudRate.writeValue(data);
  }

  async uartWrite(data: Uint8Array) {
    const chunkSize = Konashi.UART.DATA_MAX_LENGTH;

    if (data.length <= chunkSize) {
      await this._uartWrite(data);
    }

    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    await this._uartWriteChunks(chunks, 0);
  }

  async _uartWriteChunks(chunks: Uint8Array[], index: number) {
    if (chunks.length <= index) {
      return;
    }

    await this._uartWrite(chunks[index]);
    await this._uartWriteChunks(chunks, index + 1);
  }

  async _uartWrite(data: Uint8Array) {
    if (Konashi.UART.DATA_MAX_LENGTH < data.length) {
      throw new Error(
        "The data size has to be less then " +
          Konashi.UART.DATA_MAX_LENGTH +
          "."
      );
    }
    const writeData = new Uint8Array(data.length + 1);
    writeData[0] = data.length;
    data.forEach((v: Uint8Array[0], i: number) => {
      writeData[i + 1] = v;
    });
    await this._c12c.uartTx.writeValue(writeData);
  }

  async i2cMode(
    mode:
      | Konashi.I2C.DISABLE
      | Konashi.I2C.DISABLE
      | Konashi.I2C.ENABLE_100K
      | Konashi.I2C.ENABLE_400K
  ) {
    await this._c12c.i2cConfig.writeValue(new Uint8Array([mode]));
  }

  async i2cStopCondition() {
    await this._i2cSendCondition(Konashi.I2C.STOP_CONDITION);
  }

  async i2cStartCondition() {
    await this._i2cSendCondition(Konashi.I2C.START_CONDITION);
  }

  async i2cRestartCondition() {
    await this._i2cSendCondition(Konashi.I2C.RESTART_CONDITION);
  }

  async _i2cSendCondition(
    condition:
      | Konashi.I2C.STOP_CONDITION
      | Konashi.I2C.START_CONDITION
      | Konashi.I2C.RESTART_CONDITION
  ) {
    await this._c12c.i2cStartStop.writeValue(new Uint8Array([condition]));
  }

  async i2cWrite(address: Uint8Array[0], data: Uint8Array) {
    const chunkSize = Konashi.I2C.DATA_MAX_LENGTH;
    if (data.length <= chunkSize) {
      await this._i2cWrite(address, data);
    }

    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    await this._i2cWriteChunks(address, chunks, 0);
  }

  async _i2cWriteChunks(
    address: Uint8Array[0],
    chunks: Uint8Array[],
    index: number
  ) {
    if (chunks.length <= index) {
      return;
    }

    await this._i2cWrite(address, chunks[index]);
    await this._i2cWriteChunks(address, chunks, index + 1);
  }

  async _i2cWrite(address: Uint8Array[0], data: Uint8Array) {
    if (Konashi.I2C.DATA_MAX_LENGTH < data.length) {
      throw new Error(
        "The data size has to be less than " + Konashi.I2C.DATA_MAX_LENGTH + "."
      );
    }

    const writeData = new Uint8Array(Konashi.I2C.DATA_MAX_LENGTH + 2);
    writeData[0] = data.length + 1;
    writeData[1] = (address << 1) & 0b11111110; // Write Flag

    data.forEach((v: Uint8Array[0], i: number) => {
      writeData[i + 2] = v;
    });

    await this._c12c.i2cWrite.writeValue(writeData);
  }

  async i2cRead(address: Uint8Array[0], length: Uint8Array[0]) {
    await this._i2cReadRequest(address, length);
    const dv = await this._i2cRead();
    return dv;
  }

  async _i2cReadRequest(address: Uint8Array[0], length: Uint8Array[0]) {
    if (Konashi.I2C.DATA_MAX_LENGTH < length) {
      throw new Error(
        "The data size has to be less than " + Konashi.I2C.DATA_MAX_LENGTH + "."
      );
    }

    const request = new Uint8Array(2);
    request[0] = length;
    request[1] = (address << 1) | 0b00000001; // Read Flag
    // Reference: http://www.picfun.com/f1/f06.html

    await this._c12c.i2cReadParameter.writeValue(request);
  }

  async _i2cRead(callback: (dv: DataView) => void = () => {}) {
    const dv = await this._c12c.i2cRead.readValue();

    callback(dv);
  }

  /**
   * (This is not supported by Konashi)
   */
  async softwareReset() {
    await this._c12c.softwareReset.writeValue(new Uint8Array([1]));
  }

  async reset() {
    await this._c12c.hardwareReset.writeValue(new Uint8Array([1]));
  }

  async readBatteryLevel() {
    if (!this._gatt) return;

    const service = await this._gatt.getPrimaryService("battery_service");
    const characteristic = await service.getCharacteristic("battery_level");
    const value = await characteristic.readValue();

    return value.getUint8(0);
  }

  async readSignalStrength() {
    return 0;
  }

  _throwError(error: any) {
    console.log(error);
    throw error;
  }
}

export default Konashi;

export namespace Konashi {
  export enum DEV {
    KONASHI,
    COCORO,
  }

  export enum PINS {
    PIO0,
    PIO1,
    PIO2,
    PIO3,
    PIO4,
    PIO5,
    PIO6,
    PIO7,
    AIO0 = 0,
    AIO1,
    AIO2,
    I2C_SDA = 6,
    I2C_SCL,
  }

  export enum PWM_MODES {
    DISABLE,
    ENABLE,
    ENABLE_LED_MODE,
  }

  export const HIGH = 1;
  export const LOW = 0;
  export const OUTPUT = 1;
  export const INPUT = 0;
  export const PULLUP = 1;
  export const NO_PULLS = 0;

  export const PWM_LED_PERIOD = 10000; //10ms
  export const ANALOG_REFERENCE = 1300; //1300mV

  export enum I2C {
    DISABLE,
    ENABLE,
    ENABLE_100K = 1,
    ENABLE_400K,
    STOP_CONDITION = 1,
    START_CONDITION,
    RESTART_CONDITION,
    DATA_MAX_LENGTH = 16,
  }

  export enum UART {
    DISABLE,
    ENABLE,
    RATE_2K4 = 0x000a,
    RATE_9K6 = 0x0028,
    DATA_MAX_LENGTH = 19,
  }
}
