
const markText = document.querySelector('#markText');
const selectFile = document.querySelector('#selectFile');
const resultImg = document.querySelector('#result');
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

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
  
      ctx.globalAlpha = 0.2;
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