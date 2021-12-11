var Canvas2Image = (function() {
  // check if support sth.
  var $support = (function() {
    var canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d");

    return {
      canvas: !!ctx,
      imageData: !!ctx.getImageData,
      dataURL: !!canvas.toDataURL,
      btoa: !!window.btoa
    };
  })();

  var downloadMime = "image/octet-stream";

  function scaleCanvas(canvas, width, height) {
    var w = canvas.width,
      h = canvas.height;
    if (width == undefined) {
      width = w;
    }
    if (height == undefined) {
      height = h;
    }

    var retCanvas = document.createElement("canvas");
    var retCtx = retCanvas.getContext("2d");
    retCanvas.width = width;
    retCanvas.height = height;
    retCtx.drawImage(canvas, 0, 0, w, h, 0, 0, width, height);
    return retCanvas;
  }

  function getDataURL(canvas, type, width, height) {
    canvas = scaleCanvas(canvas, width, height);
    return canvas.toDataURL(type);
  }

  function saveFile(strData) {
    var aLink = document.createElement("a");
    aLink.download = "watermark.jpg";
    aLink.href = strData;
    aLink.click();
  }

  function genImage(strData) {
    var img = document.createElement("img");
    img.src = strData;
    return img;
  }
  function fixType(type) {
    type = type.toLowerCase().replace(/jpg/i, "jpeg");
    var r = type.match(/png|jpeg|bmp|gif/)[0];
    return "image/" + r;
  }
  function encodeData(data) {
    if (!window.btoa) {
      throw "btoa undefined";
    }
    var str = "";
    if (typeof data === "string") {
      str = data;
    } else {
      for (var i = 0; i < data.length; i++) {
        str += String.fromCharCode(data[i]);
      }
    }

    return btoa(str);
  }
  function getImageData(canvas) {
    var w = canvas.width,
      h = canvas.height;
    return canvas.getContext("2d").getImageData(0, 0, w, h);
  }
  function makeURI(strData, type) {
    return "data:" + type + ";base64," + strData;
  }

  /**
   * create bitmap image
   * 按照规则生成图片响应头和响应体
   */
  var genBitmapImage = function(oData) {
    //
    // BITMAPFILEHEADER: http://msdn.microsoft.com/en-us/library/windows/desktop/dd183374(v=vs.85).aspx
    // BITMAPINFOHEADER: http://msdn.microsoft.com/en-us/library/dd183376.aspx
    //

    var biWidth = oData.width;
    var biHeight = oData.height;
    var biSizeImage = biWidth * biHeight * 3;
    var bfSize = biSizeImage + 54; // total header size = 54 bytes

    //
    //  typedef struct tagBITMAPFILEHEADER {
    //  	WORD bfType;
    //  	DWORD bfSize;
    //  	WORD bfReserved1;
    //  	WORD bfReserved2;
    //  	DWORD bfOffBits;
    //  } BITMAPFILEHEADER;
    //
    var BITMAPFILEHEADER = [
      // WORD bfType -- The file type signature; must be "BM"
      0x42,
      0x4d,
      // DWORD bfSize -- The size, in bytes, of the bitmap file
      bfSize & 0xff,
      (bfSize >> 8) & 0xff,
      (bfSize >> 16) & 0xff,
      (bfSize >> 24) & 0xff,
      // WORD bfReserved1 -- Reserved; must be zero
      0,
      0,
      // WORD bfReserved2 -- Reserved; must be zero
      0,
      0,
      // DWORD bfOffBits -- The offset, in bytes, from the beginning of the BITMAPFILEHEADER structure to the bitmap bits.
      54,
      0,
      0,
      0
    ];

    //
    //  typedef struct tagBITMAPINFOHEADER {
    //  	DWORD biSize;
    //  	LONG  biWidth;
    //  	LONG  biHeight;
    //  	WORD  biPlanes;
    //  	WORD  biBitCount;
    //  	DWORD biCompression;
    //  	DWORD biSizeImage;
    //  	LONG  biXPelsPerMeter;
    //  	LONG  biYPelsPerMeter;
    //  	DWORD biClrUsed;
    //  	DWORD biClrImportant;
    //  } BITMAPINFOHEADER, *PBITMAPINFOHEADER;
    //
    var BITMAPINFOHEADER = [
      // DWORD biSize -- The number of bytes required by the structure
      40,
      0,
      0,
      0,
      // LONG biWidth -- The width of the bitmap, in pixels
      biWidth & 0xff,
      (biWidth >> 8) & 0xff,
      (biWidth >> 16) & 0xff,
      (biWidth >> 24) & 0xff,
      // LONG biHeight -- The height of the bitmap, in pixels
      biHeight & 0xff,
      (biHeight >> 8) & 0xff,
      (biHeight >> 16) & 0xff,
      (biHeight >> 24) & 0xff,
      // WORD biPlanes -- The number of planes for the target device. This value must be set to 1
      1,
      0,
      // WORD biBitCount -- The number of bits-per-pixel, 24 bits-per-pixel -- the bitmap
      // has a maximum of 2^24 colors (16777216, Truecolor)
      24,
      0,
      // DWORD biCompression -- The type of compression, BI_RGB (code 0) -- uncompressed
      0,
      0,
      0,
      0,
      // DWORD biSizeImage -- The size, in bytes, of the image. This may be set to zero for BI_RGB bitmaps
      biSizeImage & 0xff,
      (biSizeImage >> 8) & 0xff,
      (biSizeImage >> 16) & 0xff,
      (biSizeImage >> 24) & 0xff,
      // LONG biXPelsPerMeter, unused
      0,
      0,
      0,
      0,
      // LONG biYPelsPerMeter, unused
      0,
      0,
      0,
      0,
      // DWORD biClrUsed, the number of color indexes of palette, unused
      0,
      0,
      0,
      0,
      // DWORD biClrImportant, unused
      0,
      0,
      0,
      0
    ];

    var iPadding = (4 - (biWidth * 3) % 4) % 4;

    var aImgData = oData.data;

    var strPixelData = "";
    var biWidth4 = biWidth << 2;
    var y = biHeight;
    var fromCharCode = String.fromCharCode;

    do {
      var iOffsetY = biWidth4 * (y - 1);
      var strPixelRow = "";
      for (var x = 0; x < biWidth; x++) {
        var iOffsetX = x << 2;
        strPixelRow +=
          fromCharCode(aImgData[iOffsetY + iOffsetX + 2]) +
          fromCharCode(aImgData[iOffsetY + iOffsetX + 1]) +
          fromCharCode(aImgData[iOffsetY + iOffsetX]);
      }

      for (var c = 0; c < iPadding; c++) {
        strPixelRow += String.fromCharCode(0);
      }

      strPixelData += strPixelRow;
    } while (--y);

    var strEncoded =
      encodeData(BITMAPFILEHEADER.concat(BITMAPINFOHEADER)) + encodeData(strPixelData);

    return strEncoded;
  };

  /**
   * saveAsImage
   * @param canvasElement
   * @param {String} image type
   * @param {Number} [optional] png width
   * @param {Number} [optional] png height
   */
  var saveAsImage = function(canvas, width, height, type) {
    if ($support.canvas && $support.dataURL) {
      if (typeof canvas === "string") {
        canvas = document.getElementById(canvas);
      }
      if (type == undefined) {
        type = "png";
      }
      type = fixType(type);
      if (/bmp/.test(type)) {
        var data = getImageData(scaleCanvas(canvas, width, height));
        var strData = genBitmapImage(data);
        saveFile(makeURI(strData, downloadMime));
      } else {
        var strData = getDataURL(canvas, type, width, height);
        // saveFile(strData.replace(type, downloadMime));
        saveFile(strData);
      }
    }
  };

  var convertToImage = function(canvas, width, height, type) {
    if ($support.canvas && $support.dataURL) {
      if (typeof canvas === "string") {
        canvas = document.getElementById(canvas);
      }
      if (type == undefined) {
        type = "png";
      }
      type = fixType(type);

      if (/bmp/.test(type)) {
        var data = getImageData(scaleCanvas(canvas, width, height));
        var strData = genBitmapImage(data);
        return genImage(makeURI(strData, "image/bmp"));
      } else {
        var strData = getDataURL(canvas, type, width, height);
        return genImage(strData);
      }
    }
  };

  return {
    saveAsImage: saveAsImage,
    saveAsPNG: function(canvas, width, height) {
      return saveAsImage(canvas, width, height, "png");
    },
    saveAsJPEG: function(canvas, width, height) {
      return saveAsImage(canvas, width, height, "jpeg");
    },
    saveAsGIF: function(canvas, width, height) {
      return saveAsImage(canvas, width, height, "gif");
    },
    saveAsBMP: function(canvas, width, height) {
      return saveAsImage(canvas, width, height, "bmp");
    },

    convertToImage: convertToImage,
    convertToPNG: function(canvas, width, height) {
      return convertToImage(canvas, width, height, "png");
    },
    convertToJPEG: function(canvas, width, height) {
      return convertToImage(canvas, width, height, "jpeg");
    },
    convertToGIF: function(canvas, width, height) {
      return convertToImage(canvas, width, height, "gif");
    },
    convertToBMP: function(canvas, width, height) {
      return convertToImage(canvas, width, height, "bmp");
    }
  };
})();


const markText = document.querySelector('#markText');
const selectFile = document.querySelector('#selectFile');
const saveImg = document.querySelector('#saveImg');
const resultImg = document.querySelector('#result');
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

saveImg.addEventListener('click', () => {
  Canvas2Image.saveAsJPEG(canvas, canvas.width, canvas.height);
});

let inputedMarkText = '';
let selectedImgDOM = null;

markText.addEventListener('input', e => {
  inputedMarkText = e.target.value;

  renderTextToCanvas();
});

selectFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  console.log('file: ', file);

  const fr = new FileReader();
  fr.onload = (e) => {

    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      selectedImgDOM = img;
      renderTextToCanvas();
    };
    img.onerror = () => {
      alert('加载图片失败，垃圾手机');
    }
  };
  fr.readAsDataURL(file);

});

function renderTextToCanvas() {
  const fontSize = 48;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setTimeout(() => {
    if (selectedImgDOM) {
      ctx.drawImage(selectedImgDOM, 0, 0);
    }

    if (inputedMarkText) {
      const gridWidthSize = canvas.width / fontSize;
      const textSize = inputedMarkText.length;
  
      const columns = Math.ceil(gridWidthSize / (textSize + 2));
      const rows = canvas.height / fontSize / 2;
  
      ctx.globalAlpha = 0.5;
      ctx.font = `${fontSize}px serif`;
  
      for(let i = 0; i < rows;i++) {
        for(let j = 0; j < columns; j++) {
          const x = fontSize + (textSize * fontSize + fontSize) * j;
          const y = fontSize * 2 * (i + 1);
          ctx.fillText(inputedMarkText, x, y);
        }
      }
      ctx.globalAlpha = 1;
    }

    if (selectedImgDOM || inputedMarkText) {
      const r = canvas.toDataURL('image/png');
      resultImg.width = canvas.width
      resultImg.height = canvas.height
      resultImg.src = r;
    }
    
  }, 30);
}