import { get as getRequest } from 'request';
import * as LRU from 'lru-cache';

import { InvestorProfile, FirmProfile, InvestMentHistory, FirmMemberList } from './network.d'

const cache = new LRU({ max: 350, maxAge: 300000 }); // Cache DB queries for 3 minutes (300000ms).

setInterval(function () {
    cache.prune();
}, 300 * 1000); // 300 * 1000 milsec = every 5 minutes

async function get(url: string): Promise<any> {
    return new Promise(async function (resolve, reject) {
        const options = {
            url: url,
            gzip: true,
            json: true,
            timeout: 50000,
        };

        if (cache.has(url))
            return resolve(cache.get(url));

        // Do networking
        getRequest(options, function (err, resp, body: JSON) {
            if (err) {
                console.log('Error ' + url);
                throw (err);
            } else {
                if (isBadStatusCode(resp.statusCode)) {
                    console.error('HTTP CODE: ' + resp.statusCode + ' | URL: ' + options.url);
                    return reject(body);
                } else {
                    //console.log('Resolved ' + url);
                    cache.set(url, body);
                    return resolve(body);
                }
            }
        });
    });
}

/**
 * @description Checks the status code of the response
 * @param {Number} status The HTTP response code
 * @return {boolean} If the status code is good.
 */
function isBadStatusCode(status: number): boolean {
    if (status >= 200 && status <= 205) {
        return false;
    }
    return true;
}

export async function getInvestorProfile(name: string): Promise<InvestorProfile> {
    return get("https://meme.market/api/investor/" + name);
}

export async function getInvestorHistory(name: string, amount = 15 as number): Promise<InvestMentHistory> {
    return get(`https://meme.market/api/investor/${name}/investments?per_page=${amount}&page=0`);
}

export async function getFirmProfile(id: number): Promise<FirmProfile> {
    return get("https://meme.market/api/firm/" + id);
}

export async function getFirmMembers(id: number): Promise<FirmMemberList> {
    return get(`https://meme.market/api/firm/${id}/members?per_page=100&page=0/`);
}
