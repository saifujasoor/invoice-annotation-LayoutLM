const img = document.getElementById("selectedImage");
const output = document.querySelector(".output");
const canvas = document.getElementById("imgCanvas");
const ctx = canvas.getContext("2d");
const serverUrl = window.location.origin;

const changeImage = (input) => {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      img.src;
      img.setAttribute("src", e.target.result);
    };
    reader.readAsDataURL(input.files[0]);
  }
};

// variables
const boxes = [];
const config = {
  canvas_width: 750,
  canvas_height: 1050,
  img_width: 750,
  img_height: 1050,
};
const optionsList = [
  "invoiceNumber",
  "sendersName",
  "sendersAddress",
  "phoneNumber",
  "recieversName",
  "recieversAddress",
  "invoiceDate",
  "totalWeight",
  "totalQuantity",
];
const optionsLength = 9;
let selectedOption = optionsList[0];

window.onload = () => {
  if (!canvas) return; // when upload.html renders

  // basic configuration
  canvas.width = config.canvas_width;
  canvas.height = config.canvas_height;
  const filename = new URLSearchParams(window.location.search)
    .get("filename")
    .split(".")[0];
  const fileUrl = `${serverUrl}/static/uploads/${filename}`;

  // check image orignal width and height and draw boxes
  var newImg = new Image();
  newImg.onload = async () => {
    config.img_width = newImg.width;
    config.img_height = newImg.height;
    canvas.style.backgroundImage = `url(${fileUrl}.jpg`;

    // get json
    const response = await fetch(`${fileUrl}.json`);
    const json = await response.json();

    Object.keys(json).map((key) => {
      boxes.push({ ...json[key], tag: "O" });
    });

    console.log(boxes);

    // Draw all boxes on image
    for (let i = 0; i < boxes.length; i++) {
      const element = boxes[i];
      const { left, top, width, height } = sizesConvert(element);
      ctx.beginPath();
      ctx.strokeStyle = "#FF0000";
      ctx.rect(left, top, width, height);
      ctx.stroke();
    }
  };
  newImg.src = fileUrl + ".jpg";
};

// utils
function sizesConvert(box) {
  return {
    left: (config.canvas_width * box.left) / config.img_width,
    top: (config.canvas_height * box.top) / config.img_height,
    width: (config.canvas_width * box.width) / config.img_width,
    height: (config.canvas_height * box.height) / config.img_height,
  };
}

function selectBox(e) {
  const clickX = e.offsetX;
  const clickY = e.offsetY;
  for (let i = 0; i < boxes.length; i++) {
    const element = boxes[i];
    const { left, top, width, height } = sizesConvert(element);
    if (
      clickX > left &&
      clickX <= left + width &&
      clickY > top &&
      clickY <= top + height
    ) {
      addTagAtIndex(i);
    }
  }
}

function addTagAtIndex(i) {
  // get all boxes with same type
  let sameTag = [];
  for (let j = 0; j < boxes.length; j++) {
    if (boxes[j].tag.slice(2) == selectedOption) {
      sameTag.push({ index: j, box: boxes[j] });
    }
  }
  // switch based on how many boxes in same tag
  switch (sameTag.length) {
    case 0:
      boxes[i].tag = "S-" + selectedOption;
      break;
    case 1:
      sameTag[0].box.tag = "B-" + selectedOption;
      boxes[i].tag = "E-" + selectedOption;
      break;
    default:
      for (let k = 0; k < sameTag.length; k++) {
        if (sameTag[k].box.tag.startsWith("E-")) {
          boxes[sameTag[k].index].tag = "I-" + selectedOption;
          break;
        }
      }
      boxes[i].tag = "E-" + selectedOption;
      break;
  }
  updateOutput();
}

function removeBox(index) {
  console.log(index);
  var currentTag = boxes[index].tag;
  if (currentTag.startsWith("I") || currentTag.startsWith("S")) {
    boxes[index].tag = "O";
    updateOutput();
    return;
  }
  boxes[index].tag = "O";
  let sameTag = [];
  for (let j = 0; j < boxes.length; j++) {
    if (boxes[j].tag.slice(2) == selectedOption) {
      sameTag.push({ index: j, box: boxes[j] });
    }
  }
  switch (sameTag.length) {
    case 0:
      break;
    case 1:
      sameTag[0].box.tag = "S-" + selectedOption;
      break;

    default:
      for (let k = 0; k < sameTag.length; k++) {
        if (sameTag[k].box.tag.startsWith("I")) {
          if (currentTag.startsWith("B")) {
            sameTag[k].box.tag = "B-" + selectedOption;
          } else {
            sameTag[k].box.tag = "E-" + selectedOption;
          }
          break;
        }
      }
      break;
  }
  updateOutput();
}

function onOptionChange(e) {
  selectedOption = e.target.value;
  updateOutput();
}

function onSave() {
  console.log(boxes);
  // url endpoint
  $.post( "/save", {
    canvas_data: JSON.stringify(boxes)
  }, function(err, req, resp){
    window.location.reload();
    // window.location.href = "/results/"+resp["responseJSON"]["uuid"];  
  });
}

function updateOutput() {
  let outputHtml = "";
  for (let i = 0; i < boxes.length; i++) {
    if (boxes[i].tag.slice(2) == selectedOption) {
      outputHtml += getTemplate(boxes[i], i);
    }
  }
  output.innerHTML = outputHtml;
}

function getTemplate(box, index) {
  return `
<div class="output-text d-flex justify-content-evenly text-start bg-white shadow-sm rounded ps-2 my-1">
  <div class="txt w-100"> ${box.text} </div>
  <div class="tag text-success w-100"> ${box.tag.slice(0, 1)} </div>
  <div class="removebtn mx-2" role="button" onclick="removeBox(${index})"> X </div>
</div>`;
}


