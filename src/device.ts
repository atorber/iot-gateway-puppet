/* eslint-disable sort-keys */
import { v4 } from 'uuid'
import { Auth } from './auth'
import mqtt from 'mqtt'

type deviceType = 'DIRECT' | 'GATEWAY' | 'SUBDEVICE'

type deviceOption = {
    entryPoint: string,
    instanceId: string,
    productKey: string,
    deviceName: string
    deviceSecret: string,
    deviceType?: deviceType,
    msgHander: () => void
}

class Device {
    protected entrypoint: string
    protected productKey: string
    protected deviceName: string
    protected deviceSecret: string
    protected instanceId: string
    protected mqttClient: any


    constructor(option: deviceOption) {
        this.entrypoint = option.entryPoint;
        this.productKey = option.productKey;
        this.deviceName = option.deviceName;
        this.deviceSecret = option.deviceSecret;
        this.instanceId = option.instanceId;
        this.mqttClient = ''
        this.init(option.msgHander)
    }

    async init(baetylMqttClient: any) {
        const that = this
        const auth = new Auth(
            this.entrypoint,
            this.productKey,
            this.deviceName,
            this.deviceSecret,
            this.instanceId
        )
        const devieConfig:any = await auth.getResources()

        console.debug('devieConfig', devieConfig)

        const optionsDevice = {
            host: devieConfig.broker,
            username: devieConfig.username,
            password: devieConfig.password,
            port: devieConfig.port || 1883,
            clientId: v4()
        }

        this.mqttClient = mqtt.connect(optionsDevice)

        this.mqttClient.on('connect', function (err) {

            that.subPropertyInvoke()
            that.subCommandInvoke()
            that.subC2d()

        })

        this.mqttClient.on('disconnect', function () {
            that.mqttClient.reconnect()
        })

        this.mqttClient.on('message', function (topic, message) {
            // message is Buffer
            console.log(message.toString())
            console.log(topic)

            let report = JSON.parse(message.toString())
            // console.log(report)
            if (report.subEquipment && report.method) {

                if (topic.indexOf("property/invoke") != -1) {

                    console.log('???DMP??????????????????????????????')
                    const curSubEquipment = report.subEquipment
                    const topic = `thing/${curSubEquipment.productKey}/${curSubEquipment.deviceName}/property/invoke`
                    delete report.subEquipment
                    let payload = {
                        "kind": "deviceDelta",
                        "meta": {
                            "accessTemplate": "xw-modbus-access-template",
                            "device": curSubEquipment.deviceName, // ????????????deviceName
                            "deviceProduct": curSubEquipment.productKey, // ????????????productKey
                            "node": that.deviceName, // ?????????deviceName
                            "nodeProduct": that.productKey // ?????????productKey
                        },
                        "content": {
                            "blink": report
                        }
                    }

                    console.log('???????????????baetyl-broker????????????', topic, JSON.stringify(payload))

                    baetylMqttClient.publish(topic, JSON.stringify(payload))
                }

                //    if(topic.indexOf("event/post") != -1||report.content.blink.events){

                //        console.log('????????????????????????')

                //        let payload = report.content.blink
                //        let subEquipment = {
                //            productKey: report.meta.deviceProduct,
                //            deviceName: report.meta.device
                //        }
                //        gwClient.eventPostSub(payload, subEquipment)
                //    }

            } else {
                console.error('???????????????????????????')
            }

        })
    }

    subPropertyInvoke() {
        const topic = `thing/${this.productKey}/${this.deviceName}/property/invoke`

        this.mqttClient.subscribe(topic, function (err) {
            if (!err) {
                console.debug('??????????????????????????????????????????')
            } else {
                console.debug('??????????????????????????????????????????')
            }
        })
    }

    subCommandInvoke() {
        const topic = `thing/${this.productKey}/${this.deviceName}/command/invoke`

        this.mqttClient.subscribe(topic, function (err) {
            if (!err) {
                console.debug('?????????????????????????????????????????????')
            } else {
                console.debug('?????????????????????????????????????????????')
            }
        })
    }

    subC2d() {
        const topic = `thing/${this.productKey}/${this.deviceName}/raw/c2d`

        this.mqttClient.subscribe(topic, function (err) {
            if (!err) {
                console.debug('?????????????????????????????????')
            } else {
                console.debug('?????????????????????????????????')
            }
        })
    }

    

    d2cRawPost(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/raw/d2c`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    propertyPost(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/property/post`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    propertyBatch(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/property/batch`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    eventPost(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/event/post`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    eventBatch(payload) {
        const topic = `thing/${this.productKey}/${this.deviceName}/event/batch`
        this.mqttClient.publish(topic, JSON.stringify(payload))
    }

    propertyMessage(raw) {

        // ?????????????????????????????????????????????blink???????????????

        // let properties = {
        //     key1: 100
        // }

        // ???????????????????????????blink???????????????

        // let message = {
        //     reqId: v4(),
        //     method: 'thing.property.post',
        //     version: '1.0',
        //     timestamp: getCurTime(),
        //     properties,
        // }

        // const payload = JSON.stringify(message)
        return raw
    }

    eventMessage(raw) {

        // let message = {
        //     reqId: v4(),
        //     method: 'thing.event.post',
        //     version: '1.0',
        //     timestamp: new Date().getTime(),
        //     events: {
        //     },
        // }

        // ??????????????????????????????raw???????????????blink???????????????

        // let name = 'raw'
        // raw.data = raw.data.toString()
        // let input = raw

        // ????????????raw???????????????blink???????????????

        // message.events[name] = input
        // console.debug(message)
        return raw
    }

}

function getCurTime() {
    // timestamp?????????????????????parseInt??????
    const timestamp = new Date().getTime()
    const timezone = 8 // ??????????????????????????????
    const offsetGMT = new Date().getTimezoneOffset() // ?????????????????????????????????????????????????????????
    // const time = timestamp + offsetGMT * 60 * 1000 + timezone * 60 * 60 * 1000
    const time = timestamp + offsetGMT * 60 * 1000
    return time
}

export {
    type deviceType,
    type deviceOption,
    Device
}