import * as fs from 'fs';
import { configvalues } from './config.d'

let config = {
    "token": "entertokenhere",
    "channels": [
        "channel-id"
    ],
    "websocket": {
        "enabled": false,
        "url": "ws://yourip:port"
    },
    "mysql": {
		"host": "127.0.0.1",
		"port": 3306,
		"user": "user",
		"password": "password",
		"database": "memecord"
    },
    "reddit": {
        "clientId": "clientId",
        "clientSecret": "clientSecret",
        "refreshToken": "refreshToken",
        "userAgent": "userAgent"
    }
} as configvalues;

loadConfig();

/**
 * @description Load the config and create file if not exists
 */
async function loadConfig() {
    try {
        let rawdata = fs.readFileSync('./config.json', "utf8");
        let data = JSON.parse(rawdata);
        config = data;
    } catch (error) {
        if (error.code === "ENOENT") {
            writeConfig();
        } else {
            console.error(error);
        }
    }
}

/**
 * @description Write the config to disk
 */
export async function writeConfig() {
    let data = JSON.stringify(config, null, '\t');
    await fs.writeFileSync('./config.json', data);
}

export function getConfig(): configvalues {
    return config;
}

export function setConfig(newconfig: configvalues) {
    config = newconfig;
    writeConfig();
}
