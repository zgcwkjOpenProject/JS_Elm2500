/**
 * 变量：elmck: 必填，账号cookie
 * cron: 35 *\/2 * * *
 */
const {
    Env
} = require("./common.js");
const $ = new Env('饿了么特级厨师');
const qs = require("qs");
const request = require("request");

const {
    sign:getSign,
    getCookies,
    getToken,
    "checkCk": checkCk,
    getUserInfo,
    wait,
} = require("./common.js");

function updateCookie(tkCookie, encCookie, cookieStr) {
    // 合并带_m_h5_tk
    let txt = cookieStr.replace(/\s/g, '');
    txt = txt.replace(/chushi;/g, '');
    if (!txt.endsWith(';')) {
        txt += ';';
    }

    let cookieParts = txt.split(';').slice(0, -1);
    let updated = false;

    for (let i = 0; i < cookieParts.length; i++) {
        let keyValuePair = cookieParts[i].split('=');
        let key = keyValuePair[0].trim();
        if (key === "_m_h5_tk" || key === " _m_h5_tk") {
            cookieParts[i] = tkCookie;
            updated = true;
        } else if (key === "_m_h5_tk_enc" || key === " _m_h5_tk_enc") {
            cookieParts[i] = encCookie;
            updated = true;
        }
    }

    if (updated) {
        return cookieParts.join(';') + ';';
    } else {
        return txt + tkCookie + ';' + encCookie + ';';
    }
}
function isObjectEmpty(obj) {
    return Object.values(obj).length === 0;
}

async function playChefGame(cookie) {
    const t = Date.now();
    const body_str = "{\"bizScene\": \"XIAODANGJIA\",\"actId\": \"20230117134129770153614517\",\"uniqueId\": \"\",\"latitude\": \"30.17862595617771\",\"longitude\": \"120.22057268768549\",\"cityId\": \"2\",\"bizCode\": \"XIAODANGJIA\",\"collectionId\": \"20230421102945045949799658\",\"componentId\": \"20230505143809276394718532\",\"extParams\": \"{\\\"actId\\\":\\\"20230117134129770153614517\\\",\\\"bizScene\\\":\\\"XIAODANGJIA\\\",\\\"desc\\\":\\\"玩特级厨师挑战赛\\\"}\",\"asac\": \"2A22C0239QW1FOL3UUQY7U\"}"
    const api = 'mtop.koubei.interactioncenter.platform.right.lottery'
    const { data } = await h5Request(body_str, "12574478", "shopping.ele.me", api, cookie)

    if (Object.keys(data.data).length === 0) {
        console.log(data.ret[0])
        return false
    } else {
        const amount = data.data.sendRightList[0].discountInfo.amount;
        console.log("特级厨师闯关成功。获得：" + amount + " 乐园币");
        if (amount && amount !== 1) {
            console.log("防止频繁，延时 5 秒");
            await wait(5);
            return await playChefGame(cookie)
        }else{
            return null
        }
    }
}

// 161274962374%40eleme_android_11.12.88"
async function h5Request(dataObj, appkey, host, api, cookie, extraHeader = {}, ttid = '161274962374%40eleme_android_11.12.88') {
    const t = new Date().getTime();
    const tk = getToken(cookie)
    const stk = tk.split("_")[0];
    const sign = await getSign(`${stk}&${t}&${appkey}&${dataObj}`)
    const parm = "jsv=2.7.0&appKey=" + appkey + "&t=" + t + "&sign=" + sign + "&api=" + api + "&v=1.0&ecode=1&type=json&valueType=string&needLogin=true&LoginRequest=true&dataType=jsonp&ttid=" + ttid;
    const header = {
        'content-type': 'application/x-www-form-urlencoded',
        'Connection': 'keep-alive',
        'Cookie': cookie + ';',
        'user-agent': 'Mozilla/5.0 (WindOws NT 10.0; WOW64) AppLeWebKit/537.36 (KHTML, like Gecko) chrome/86.0.4240.198 Safari/537.36',
        'accept': 'application/json',
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        "Origin": "https://tb.ele.me",
        'referer': "https://servicewechat.com/wxece3a9a4c82f58c9/626/page-frame.html",
        'accept-language': 'zh-CN,zh;q=0.9',
    }
    Object.assign(header, extraHeader)
    const options = {
        url: "https://" + host + "/h5/" + api + "/1.0/?" + parm,
        method: "POST",
        headers: header,
        body: qs.stringify({ data: dataObj })
    }

    return new Promise(callback => {
        request(options, async (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const responseBody = JSON.parse(body);
                if (responseBody.ret[0].includes('令牌')) {
                    const setCookieHeader = JSON.stringify(response.headers["set-cookie"]);
                    const newToken = /_m_h5_tk=(\S*);/.exec(setCookieHeader)[1];
                    const newTokenEnc = /_m_h5_tk_enc=(\S*);/.exec(setCookieHeader)[1];
                    cookie = updateCookie(` _m_h5_tk=${newToken.split(";")[0]}`, ` _m_h5_tk_enc=${newTokenEnc.split(";")[0]}`, cookie);
                    callback(await h5Request(dataObj, appkey, host, api, cookie))
                    // await playChefGame(cookie)
                } else {
                    callback(responseBody);
                }
            } else {
                console.log(error || body);
                callback();
            }
        });

    })
}


async function start() {
    const _0x2f100c = getCookies();
    for (let _0x28bb82 = 0; _0x28bb82 < _0x2f100c["length"]; _0x28bb82++) {
        const _0x10e68c = _0x2f100c[_0x28bb82];
        if (!_0x10e68c) {
            console["log"](" ❌无效用户信息, 请重新获取ck");
        } else {
            try {
                let _0x3b7f88 = await checkCk(_0x10e68c, _0x28bb82);
                if (!_0x3b7f88) {
                    continue;
                }
                let _0x2d55f7 = await getUserInfo(_0x3b7f88);
                if (!_0x2d55f7.encryptMobile) {
                    console["log"]('第', _0x28bb82 + 1, "账号失效！请重新登录！！！😭");
                    continue;
                }
                const _0x5cb41f = _0x2d55f7["localId"];
                console["log"]("******开始【饿了么账号", _0x28bb82 + 1, '】', _0x2d55f7.encryptMobile, "*********");
                let gameInProgress = await playChefGame(_0x3b7f88);
                while (gameInProgress) {
                    gameInProgress = await playChefGame(_0x3b7f88);
                }
                console["log"]("防止黑号延时3-5秒");
                await wait(getRandom(3, 5));
            } catch (_0x2a2515) {
                console["log"](_0x2a2515);
            }
        }
    }
    process["exit"](0);
}

start();

function getRandom(_0x452fcd, _0x5adc25) {
    return Math["floor"](Math["random"]() * (_0x5adc25 - _0x452fcd + 1) + _0x452fcd);
}
