import ejs from '../deps/ejs.js'
import config from './config.mjs'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import MD from '../deps/markdown-it.mjs'

const md = new MD()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const mdTemp = fs.readFileSync(path.join(__dirname, './ejs/md-phase.ejs')).toString()
const htmlTemp = fs.readFileSync(path.join(__dirname, './ejs/template-index.ejs')).toString()
const navTemp = fs.readFileSync(path.join(__dirname, './ejs/nav.ejs')).toString()

const mdsDir = config.entry.dir
const outputDir = config.output.dir
const dirs = fs.readdirSync(mdsDir)

function readFileTree (root, m) {
  const isDir = fs.lstatSync(root).isDirectory()
  if (isDir) {
    const files = fs.readdirSync(root)
    files.forEach(f => {
      const p = path.join(root, f)
      const isDir = fs.lstatSync(p).isDirectory()
      if (isDir) {
        readFileTree(p, m)
      } else if (/\.md$/.test(p)) {
        m.set(p, {
          getContent: () => fs.readFileSync(p).toString()
        })
      }
    })  
  } else {
    m.set(root, {
      getContent: () => fs.readFileSync(root).toString()
    })
  }
}

const navNames = Object.entries(config.nameMap).map(([k, v]) => ({
  name: k,
  cn: v
}))

const navHTML = ejs.render(navTemp, {
  names: navNames
})

function last (arr = []) {
  return arr[arr.length - 1]
}

dirs.forEach(root => {
  const fileList = new Map()
  readFileTree(path.join(mdsDir, root), fileList)
  
  const arr = []
  const arrWithoutIndex = []
  for (const f of fileList) {
    const content = f[1].getContent()
    if (content) {
      const html = md.render(content)
      let index = f[0].match(/\[(\d+)\]/)
      const name = last(f[0].split('/').filter(Boolean))
      if (index) {
        index = parseInt(index[1], 10)
        arr[index] = {
          index,
          html,
        }
      } else {
        arrWithoutIndex.push({
          index: name,
          html,
        })
      }
    }
  }
  const final = arr.reverse().concat(arrWithoutIndex).filter(Boolean).map(v => {
    const final2 = v.html.replace(/<a /g, '<span class="inner-link" ').replace(/a>/g, 'span>')

    return ejs.render(mdTemp, {
      md: final2,
      hash: encodeURIComponent(v.index)
    })
  }).join('\n')


  const finalHtml = ejs.render(htmlTemp, {
    htmls: final,
    nav: navHTML
  })

  fs.writeFileSync(path.join(outputDir, `${root.replace(/\.md$/, '')}.html`), finalHtml)
})

console.log('build html done')