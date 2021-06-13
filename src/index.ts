import { API, HAP, Logging, Service, Characteristic } from 'homebridge';
import { SesameAPI } from './sesame-api';
import {
  Sesame2Cmd,
  Sesame2Status,
  Sesame2StatusResponse
} from './sesame-api/type';

let hap: HAP;

export = (api: API): void => {
  hap = api.hap;
  api.registerAccessory('SESAMEOS2', SESAMEOS2);
};

type Config = {
  uuid: string;
  secret?: string;
  secretKey?: string;
  accessToken: string;
  intervalSeconds?: number;
  displayName?: string;
};

class SESAMEOS2 {
  private readonly log: Logging;
  private readonly config: Config;
  private readonly api: API;
  private readonly Service;
  private readonly Characteristic;

  private readonly currentStateCharacteristic: Characteristic;
  private readonly targetStateCharacteristic: Characteristic;
  private readonly informationService: Service;
  private readonly service: Service;

  private readonly sesame: SesameAPI;
  private currentTarget?: boolean;
  private currentStatus?: Sesame2StatusResponse;

  /**
   * REQUIRED - This is the entry point to your plugin
   */
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    this.service = new hap.Service.LockMechanism(config.name);

    if (!this.config.secret && !this.config.secretKey) {
      throw new Error('Please input secret or secretKey to config.');
    }

    this.currentStateCharacteristic = this.service
      .getCharacteristic(this.Characteristic.LockCurrentState)
      .onGet(this.handleLockCurrentStateGet.bind(this));

    this.targetStateCharacteristic = this.service
      .getCharacteristic(this.Characteristic.LockTargetState)
      .onGet(this.handleLockTargetStateGet.bind(this))
      .onSet(this.handleLockTargetStateSet.bind(this));

    this.informationService = new this.Service.AccessoryInformation()
      .setCharacteristic(this.Characteristic.Manufacturer, 'jp.candyhouse.co')
      .setCharacteristic(this.Characteristic.Model, 'SESAME 3')
      .setCharacteristic(this.Characteristic.SerialNumber, this.config.uuid);

    this.sesame = new SesameAPI(
      this.config.accessToken,
      this.config.uuid,
      this.config.secret || this.config.secretKey || '',
      {
        isQRSecret: !!this.config.secret,
        displayName: this.config.displayName || 'Homebridge'
      }
    );

    const job = () => {
      void this.getStatus();
    };

    const interval = this.config.intervalSeconds || 300;
    job();
    setInterval(job, interval * 1000);
  }

  /**
   * REQUIRED - This must return an array of the services you want to expose.
   * This method must be named "getServices".
   */
  getServices() {
    return [this.informationService, this.service];
  }

  async handleLockCurrentStateGet() {
    this.log.debug('Triggered GET LockCurrentState');

    const { UNSECURED, SECURED } = this.Characteristic.LockCurrentState;
    const locked = this.currentStatus?.CHSesame2Status === Sesame2Status.Locked;

    return locked ? SECURED : UNSECURED;
  }

  async handleLockTargetStateGet() {
    this.log.debug('Triggered GET LockTargetState');

    const { UNSECURED, SECURED } = this.Characteristic.LockTargetState;

    return this.currentTarget ? SECURED : UNSECURED;
  }

  async handleLockTargetStateSet(value) {
    this.log.debug('Triggered SET LockTargetState:', value);

    const { SECURED } = this.Characteristic.LockTargetState;

    await this.updateStatus(value === SECURED);
  }

  private async updateStatus(lock: boolean): Promise<void> {
    const { UNSECURED, SECURED } = this.Characteristic.LockTargetState;
    this.targetStateCharacteristic.updateValue(lock ? SECURED : UNSECURED);
    this.currentTarget = lock;

    await this.sesame.runCommand(lock ? Sesame2Cmd.Lock : Sesame2Cmd.Unlock);

    setTimeout(() => {
      this.getStatus(true);
    }, 2000);
  }

  private async getStatus(force?: boolean): Promise<void> {
    this.log.debug('getStatus');

    const result = await this.sesame.getStatus();
    this.currentStatus = result;

    const locked = result.CHSesame2Status === Sesame2Status.Locked;

    const { UNSECURED, SECURED } = this.Characteristic.LockCurrentState;
    this.currentStateCharacteristic.updateValue(locked ? SECURED : UNSECURED);

    if (!force) {
      const { UNSECURED, SECURED } = this.Characteristic.LockTargetState;
      this.targetStateCharacteristic.updateValue(locked ? SECURED : UNSECURED);
      this.currentTarget = locked;
    }

    this.log.debug('getStatus Result', result);
  }
}
