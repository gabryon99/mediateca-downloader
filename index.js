const yargs = require('yargs');
const chalk = require('chalk');
const puppeteer = require('puppeteer');
const fs = require('fs');
const os = require("os");
const Axios = require("axios");

const info = m => console.info(chalk.blue.bold(`[INFO] `) + chalk.blueBright(m));
const success = m => console.error(chalk.green.bold(`[SUCCESS] `) + chalk.greenBright(m));
const error = m => console.error(chalk.red.bold(`[ERROR] `) + chalk.redBright(m));

const get_credentials_from_file = () => {

    const data = fs.readFileSync('./credentials.json');
    const credentials = JSON.parse(data);

    return {
        username: credentials.username,
        password: credentials.password
    }

};

const download_video = async (path, url) => {

    const writer = fs.createWriteStream(path);

    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    });

}

const download_subject = async (url) => {

    info(`given page: ${url}`);

    const browser = await puppeteer.launch({headless: true, defaultViewport: {
        width: 1280,
        height: 720
    }});

    info(`opening a new page...`);
    const page = await browser.newPage();

    info('requesting UNIPI credentials from user...');
    const {username, password} = get_credentials_from_file();
    await page.goto(`https://mediateca.unipi.it`);
    await page.evaluate((username, password, info) => {
       
        $(`#signin_username`).val(username);
        $(`#signin_password`).val(password);
        $(`form#header_login`).submit();

    }, username, password);
    info(`credentials submitted!`);    
    await page.waitForNavigation({waitUntil: `domcontentloaded`});
    info(`login done!`);    

    await page.goto(url);
    info(`${url} loaded! Scraping the page...`);

    const directory_name = await page.evaluate(() => {
        return $('#siteContent h1').text().replace(/(Categorie)|(Informatica)|/g, '').trim();
    });

    info(`directory name: ${directory_name}`);

    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(`.mediaCover > a`)).map(a => a.href);
    });

    const path = `${os.homedir()}/Videos/${directory_name}`;
    info(`creating directory at: ${path}`)
    fs.mkdirSync(path);

    const video_links = [];

    for (const link of links) {

        info(`going to ${link}`);
        await page.goto(link);
        const video_link = await page.evaluate(() => $(`video#p_video>source[type="video/mp4"]`).attr('src'));
        info(`video link captured!`);
        video_links.push(video_link);
    }

    await page.close();
    info(`closing the headless browser...`);
    await browser.close();

    info('preparing to download videos...');
    let index = 0;
    for (const video of video_links) {
        
        info(`downloading ${video}...`);
        await download_video(`${path}/video${index++}.mp4`, video);

    }

}


const argv = yargs.command(
    'download [url]',
    'Download entire subject from mediateca giving an URL', 
    (args) => {
        args.positional('url', {
            describe: 'the url containing the subject',
            default: null
        });
    },
    (argv) => {
        download_subject(argv.url);
    }
).argv;

