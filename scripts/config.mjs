import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config = {
  entry: {
    dir: path.join(__dirname, '../mds')
  },
  output: {
    dir: path.join(__dirname, '../'),
  }
}

export default config
