const path = require('path');
const notifier = require('node-notifier');
const fetch = require('node-fetch');
const fs = require('fs');
const open = require('open');

const { API_TOKEN } = JSON.parse(fs.readFileSync('./config.json').toString());

async function checkAndNotify() {
    var reviewCount = await getReviewCount();

    if (reviewCount > 0) {
        console.log(`# ${reviewCount} reviews found`);
        sendNotification(reviewCount);
    } else {
        console.log(`- no reviews found`);
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getReviewCount() {
    return new Promise((resolve, reject) => {
        fetch(`https://api.wanikani.com/v2/summary`, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0",
                "Authorization": `Bearer ${API_TOKEN}`
            }
        })
            .then(res => res.json())
            .then(json => {
                const now = new Date();
                const nextReviews = new Date(json.data.next_reviews_at);

                if (nextReviews.getTime() - now.getTime() < 0) {
                    const count = json.data.reviews[0].subject_ids.length;

                    return resolve(count);
                }

                return resolve(0);
            })
            .catch(err => reject(err));
    });
}

function sendNotification(reviewCount) {
    notifier.notify({
        title: "Wanikani",
        message: `${reviewCount} reviews available!`,
        icon: path.join(__dirname, 'wk-icon.png'),
        sound: false,
        wait: true,
    }, () => {
        open('https://www.wanikani.com/review');
    });
}

async function main() {
    while (true) {
        checkAndNotify();

        var now = new Date();
        var then = new Date();
        then.setHours(now.getHours() + 1);
        then.setMinutes(2, 0, 0);

        var waitTime = then.getTime() - now.getTime();

        await sleep(waitTime);
    }
}

main();