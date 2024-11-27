/**
 * 变量：elmck: 必填，账号cookie
 * cron: 7 9,15 * * *
*/

const https = require('https');
https.globalAgent.options.rejectUnauthorized = false;
const {
    getCookies,
    sign,
    wait,
    getToken,
    checkCk,
    getUserInfo,
    Env
} = require("./common.js");
const $ = new Env('饿了么连连看');
const request = require("request");

async function getGameToken(cookie) {
    let requestData = {
        "bizScene": "LIANLIANKAN",
        "bizMethod": "login",
        "bizParam": JSON.stringify({
            "inviterId": null,
            "gameId": null,
            "token": "token"
        }),
        "longitude": 114.174328,
        "latitude": 22.316555
    };
    const response = await gameRequest(cookie, requestData);
    let resData = JSON.parse(response.data);
    return { token: resData.data.token, openId: resData.data.openId };
}

async function getGameCode(cookie, token) {
    const requestData = {
        "bizScene": "LIANLIANKAN",
        "bizMethod": "startGameV2",
        "bizParam": JSON.stringify({
            "gameId": null,
            "token": token
        }),
        "longitude": 114.174328,
        "latitude": 22.316555
    };
    const response = await gameRequest(cookie, requestData);
    let resData = JSON.parse(response.data);
    if (resData.bizErrorMsg !== "success") {
        console.log(resData.bizErrorMsg == 'The game level complete today' ? '今日已通关，明天再来！' : resData.bizErrorMsg);
        return null;
    }
    return {
        gameCode: resData.data.gameCode,
        levelId: resData.data.levelId,
        serverTime: resData.serverTime,
    };
}

async function passGame(cookie, gameCode, token, openId, gameTimes = 0) {
    try {
        let signStr = await sign(`Game[${openId}]-${token}|${gameCode}${gameTimes}`);
        const requestData = {
            "bizScene": "LIANLIANKAN",
            "bizMethod": "settlement",
            "bizParam": JSON.stringify({
                "gameCode": gameCode,
                "passLevelTime": gameTimes,
                "gameId": null,
                "sign": signStr,
                "token": token
            }),
            "longitude": 114.174328,
            "latitude": 22.316555
        };

        const response = await gameRequest(cookie, requestData);
        let resData = JSON.parse(response.data);

        if (resData.bizErrorMsg !== "success") {
            console.log(resData.bizErrorMsg);
            return null;
        }
        return resData.data;
    } catch (error) {
        console.error("结算游戏过程中发生错误:", error);
        return null;
    }
}

async function playGame(cookie, token, openId, gameTimes = 0) {
    try {
        let timestamp = new Date().getTime();
        const codeData = await getGameCode(cookie, token);
        if (!!codeData) {
            console.log('当前关卡', codeData.levelId);
            if (codeData.levelId == 2) {
                gameTimes = 36;
            } else {
                gameTimes = 8;
            }
            console.log('随机玩游戏' + gameTimes + ' s');
            await wait(gameTimes);
            timestamp = new Date().getTime();
            gameTimes = timestamp - codeData.serverTime;
            const passGameData = await passGame(cookie, codeData.gameCode, token, openId, gameTimes);
            if (!!passGameData) {
                console.log('连连看第' + passGameData.lastLevelId + '关闯关成功');
                if (!!passGameData.lastLevelId && passGameData.lastLevelId !== 3) {
                    console.log('防黑，延迟 1-3 s');
                    await wait(getRandomInt(1, 3));

                    await playGame(cookie, token, openId, gameTimes);
                } else {
                    console.log('任务结束');
                }
            } else {
                console.log('游戏时间出错！');
            }
        } else {
            console.log('没有游戏次数了！');
        }
    } catch (error) {
        console.error("游戏过程中发生错误:", error);
    }
}

async function gameRequest(cookie, requestData = {}) {
    const headers = {
        "authority": "shopping.ele.me",
        "accept": "application/json",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
        "origin": "https://r.ele.me",
        "pragma": "no-cache",
        "referer": "https://r.ele.me/linkgame/index.html?navType=3&spm-pre=a2ogi.13162730.zebra-ele-login-module-9089118186&spm=a13.b_activity_kb_m71293.0.0",
        "cookie": cookie,
        "x-ele-ua": "RenderWay/H5 AppName/wap Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36",
        "user-agent": "Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36"
    };

    const timestamp = new Date().getTime();
    const appKey = 12574478;
    const token = getToken(cookie).split("_")[0];

    const signStr = await sign(`${token}&${timestamp}&${appKey}&${JSON.stringify(requestData)}`);
    const options = {
        url: "https://shopping.ele.me/h5/mtop.alsc.playgame.mini.game.dispatch/1.0/?jsv=2.6.1&appKey=12574478&t=" + timestamp + "&sign=" + signStr + "&api=mtop.alsc.playgame.mini.game.dispatch&v=1.0&type=originaljson&dataType=json&timeout=5000&subDomain=shopping&mainDomain=ele.me&H5Request=true&pageDomain=ele.me&ttid=h5%40chrome_android_87.0.4280.141&SV=5.0",
        method: "POST",
        headers: headers,
        body: "data=" + encodeURIComponent(JSON.stringify(requestData))
    };

    return new Promise(resolve => {
        request(options, async (error, response, body) => {
            if (!error && response.statusCode === 200) {
                try {
                    const result = JSON.parse(body);
                    const data = result.data;
                    resolve(data);
                } catch (err) {
                    console.log("解析 JSON 失败:", body);
                    resolve(null);
                }
            } else {
                console.log("请求失败:", error, response && response.statusCode);
                resolve(null);
            }
        });
    });
}

async function main() {
    let cookies = [];
    if (process.env.elmck) {
        cookies = getCookies();
    } else {
        cookies = cookies.concat(['']);
        if (cookies.length < 1) {
            console.log("检测到环境变量、本地ck都为空");
            return;
        }
    }

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        try {
            let validCookie = await checkCk(cookie, i);
            if (!validCookie) {
                continue;
            }
            let userInfo = await getUserInfo(validCookie);
            if (!userInfo.userName) {
                console.log("第", i + 1, "账号失效！请重新登录！！！😭");
                continue;
            }
            console.log("\n****** #", i + 1, userInfo.userName, " *********");
            console.log("账号的 id 为", userInfo.localId);

            const { token, openId } = await getGameToken(validCookie);
            await playGame(validCookie, token, openId);

            console.log("防止黑号延时1-3秒");
            await wait(getRandomInt(1, 3));
        } catch (error) {
            console.error("发生错误，继续执行下一个账号:", error);
        }
    }

    process.exit(0);
}

main();

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
