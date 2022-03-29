import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config = {
  nameMap: {
    index: '首页',
    about: '关于'
  },
  entry: {
    dir: path.join(__dirname, '../mds')
  },
  output: {
    dir: path.join(__dirname, '../'),
  }
}

export default config
