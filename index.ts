import axios from 'axios'
import cheerio from 'cheerio'
import wallpaper from 'wallpaper'
import { exec } from 'child_process'
import fs from 'fs'

const splashWebsite = "https://unsplash.com/s/photos/background?orientation=landscape&color=black"

async function main () {

   const $ = await fetchData(splashWebsite)

   const images = $('a._2Mc8_')

   const wallpapers: [string, string][] = []

   images.each((i, el) => {
      const image = el.attribs
      wallpapers.push([image.title.replace(/[\s']/g, '-'), image.href]) 
   })

   const [selectedImgName, selectedImgUrl] = randomPick(wallpapers)

   const img = "https://unsplash.com" + selectedImgUrl



   const $$ = await fetchData(img)

   //downloadble image url
   const dlbeImageUrl = $$('img._2zEKz').attr('src')

   await downloadImage(tuneImage(dlbeImageUrl!), selectedImgName)

   const cmd = `cmd() {
    CMD=$1
    shift;
    ARGS=$@
    WIN_PWD=\`wslpath -w "$(pwd)"\`
    cmd.exe /c "pushd $\{WIN_PWD} && $\{CMD} $\{ARGS}"
};`

   exec(cmd + 'cmd wallpaper ' + selectedImgName + '.png', (error, stdout, stderr) => {
      if(error) {
         console.log(error)
      }
      if(stderr) {
         console.log(stderr)
      }
      console.log(stdout)
   })

   deletePngFiles(selectedImgName)


}


const frequency = 30 //in minute

setInterval(main,frequency * 60 * 1000)

async function downloadImage (url: string, fileName: string) {
   const writer = fs.createWriteStream(fileName + ".png")

   const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
   })

   response.data.pipe(writer)

   return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
   })

}

async function fetchData (url: string) {
   const result = await axios.get(url)
   return cheerio.load(result.data)
}

function randomPick<T> (arr: T[]) {
   return arr[Math.floor(Math.random() * arr.length)]
}

function tuneImage (url: string, width = 2280, height = 1420, quality = 100) {
   return url.replace('&auto=format', '')
             .replace('&w=1000', '&w=' + width)
             .replace('&q=80', '&q=' + quality) + "&h=" + height
}


function deletePngFiles (excludeFileName: string) {
   const files = fs.readdirSync('.')
   files
   .filter(x => x.endsWith('.png') && x !== excludeFileName + ".png" )
      .forEach(v => {
         fs.unlinkSync(v)
      })
}






