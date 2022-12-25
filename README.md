# Wonky V2 Web Controller

Browser controller for Wonky V2 Biped (Powered by Cocorokit).

Controller implementation is based on CocoroKit Javascript SDK (https://github.com/YUKAI/cocorokit-js-sdk) which was re-written to support Typescript.

Frontend is written in vanilla JS and module support is provided by SystemJS (https://github.com/systemjs/systemjs)

Typescript source code is still in development!

## KState Implementation Example

Usage example for using KState with Konashi TS:

```js
const controllerState = new ControllerState({
  state: {
    deviceName: "",
    isSending: false,
    pins: setDefaultPinStates([
      Konashi.PINS.PIO0,
      Konashi.PINS.PIO1,
      Konashi.PINS.PIO2,
      Konashi.PINS.PIO3,
      Konashi.PINS.PIO4,
      Konashi.PINS.PIO5,
      Konashi.PINS.PIO6,
      Konashi.PINS.PIO7,
    ]),
  },
  setters: {
    SET_PIN_STATE(
      { state },
      pin: Konashi.PINS,
      value: { pwmMode?: Konashi.PWM_MODES, pwmRatio?: number }
    ) {
      if (value.pwmMode) state.pins[pin].pwmMode = value.pwmMode;
      if (value.pwmRatio) state.pins[pin].pwmRatio = value.pwmRatio;
    },
    SET_DEVICE_NAME({ state }, deviceName) {
      state.deviceName = deviceName;
    },
    SET_IS_SENDING({ state }, isSending) {
      state.isSending = isSending;
    },
  },
  getters: {
    getPins({ state }) {
      return Object.keys(state.pins);
    },
  },
  actions: {
    async PIN_MODE_ALL({}, modes) {
      const result = await konashi.pinModeAll(modes);
      await sleep(200);
      return result;
    },
    async HARD_PWM_MODE_ALL({}, modes) {
      const result = await konashi.hardPwmModeAll(modes);
      await sleep(200);
      return result;
    },
    async HARD_PWM_DUTY({}, pin: Konashi.PINS, duty: number) {
      const result = await konashi.hardPwmDuty(pin, duty);
      await sleep(200);
      return result;
    },
    async HARD_PWM_DUTY_ALL({}, duties: number[]) {
      const result = await konashi.hardPwmDutyAll(duties);
      await sleep(50);
      await konashi.hardPwmDutyAll(duties);
      await sleep(150);
      return result;
    },
    async PWM_MODE(
      { state, commit },
      pin: Konashi.PINS,
      mode: Konashi.PWM_MODES
    ) {
      const result = await konashi.pwmMode(pin, mode);
      commit("SET_PIN_STATE", pin, { pwmMode: mode });
      await sleep(200);

      return result;
    },
    async PWM_WRITE({ state, commit }, pin: Konashi.PINS, ratio: number) {
      const result = await konashi.pwmWrite(pin, ratio).catch((error: any) => {
        console.log(error);
      });
      commit("SET_PIN_STATE", pin, { pwmRatio: ratio });
      await sleep(200);

      return result;
    },
  },
});
```
