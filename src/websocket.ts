import WebSocket = require('ws');
import { getConfig } from './config';
import { submdata } from './websocket.d';


/**
 * @description Starts websocket client which can connect to MemeBot signal server to broadcast intresting investments
 */
export function startWebSocket() {
    const ws = new WebSocket(getConfig().websocket.url);

    ws.on('message', function incoming(data) {
        //TODO: Send data to Discord broadcast handler
        console.log(data);
        
        if (data.toString().includes("submid")) {
            const json = JSON.parse(data.toString()) as submdata;
            console.log(json);
        }
    });
}
