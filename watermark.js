
const markText = document.querySelector('#markText');
const selectFile = document.querySelector('#selectFile');
const resultImg = document.querySelector('#result');
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

let inputedMarkText = '我是水印';
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
  const fontSize = 96;
  const pd = 24;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setTimeout(() => {
    if (selectedImgDOM) {
      ctx.drawImage(selectedImgDOM, 0, 0);
    }

    if (inputedMarkText) {
      const gridWidthSize = canvas.width / fontSize;
      const textSize = inputedMarkText.length;
  
      const columns = Math.ceil(gridWidthSize / (textSize)) + 5;
      const rows = canvas.height / fontSize;
  
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-45 * Math.PI / 180)
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      ctx.font = `${fontSize}px serif`;
  
      for(let i = 0; i < rows;i++) {
        for(let j = 0; j < columns; j++) {
          const x = pd + fontSize * (textSize - 1) * j - fontSize * textSize;
          const y = pd * 2 + fontSize * i * 1.5;
          
          ctx.fillText(inputedMarkText, x, y);
        }
      }
      ctx.restore();
    }

    if (selectedImgDOM || inputedMarkText) {
      const r = canvas.toDataURL('image/png');
      resultImg.src = r;
    }
    
  }, 30);
}