"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const splashWebsite = "https://unsplash.com/s/photos/background?orientation=landscape&color=black";
async function main() {
    const $ = await fetchData(splashWebsite);
    const images = $('a._2Mc8_');
    const wallpapers = [];
    images.each((i, el) => {
        const image = el.attribs;
        wallpapers.push([image.title.replace(/[\s']/g, '-'), image.href]);
    });
    const [selectedImgName, selectedImgUrl] = randomPick(wallpapers);
    const img = "https://unsplash.com" + selectedImgUrl;
    const $$ = await fetchData(img);
    //downloadble image url
    const dlbeImageUrl = $$('img._2zEKz').attr('src');
    await downloadImage(tuneImage(dlbeImageUrl), selectedImgName);
    const cmd = `cmd() {
    CMD=$1
    shift;
    ARGS=$@
    WIN_PWD=\`wslpath -w "$(pwd)"\`
    cmd.exe /c "pushd $\{WIN_PWD} && $\{CMD} $\{ARGS}"
};`;
    child_process_1.exec(cmd + 'cmd wallpaper ' + selectedImgName + '.png', (error, stdout, stderr) => {
        if (error) {
            console.log(error);
        }
        if (stderr) {
            console.log(stderr);
        }
        console.log(stdout);
    });
    deletePngFiles(selectedImgName);
}
const frequency = 30; //in minute
setInterval(main, frequency * 60 * 1000);
async function downloadImage(url, fileName) {
    const writer = fs_1.default.createWriteStream(fileName + ".png");
    const response = await axios_1.default({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
async function fetchData(url) {
    const result = await axios_1.default.get(url);
    return cheerio_1.default.load(result.data);
}
function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function tuneImage(url, width = 2280, height = 1420, quality = 100) {
    return url.replace('&auto=format', '')
        .replace('&w=1000', '&w=' + width)
        .replace('&q=80', '&q=' + quality) + "&h=" + height;
}
function deletePngFiles(excludeFileName) {
    const files = fs_1.default.readdirSync('.');
    files
        .filter(x => x.endsWith('.png') && x !== excludeFileName + ".png")
        .forEach(v => {
        fs_1.default.unlinkSync(v);
    });
}
