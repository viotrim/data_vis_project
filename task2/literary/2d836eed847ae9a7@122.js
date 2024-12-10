function _1(md){return(
md`# 琼瑶文学作品可视化`
)}

function _data(FileAttachment){return(
FileAttachment("data@3.csv").csv()
)}

function _3(data)
{data.forEach(d => {
  // 分割日期字符串为年、月、日
  const [year, month, day] = d['完稿日期'].split('/').map(Number);
  // 创建一个新的 Date 对象，注意月份是从0开始计数的
  d.date = new Date(year, month - 1, day);
});
data.sort((a, b) => a.date - b.date);
}


function _chart(d3,data)
{
  // Specify the chart’s dimensions.
  const width = 928;
  const height = 2000;
  const margin = { top: 20, right: 0, bottom: 20, left: 100 }; // 添加边距以便有空间放置时间线
  const format = d3.format(",d");
  const minRectHeight = 4;

  // Create a color scale (a color for each child of the root node and their descendants).
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.length))

  // Create a partition layout.
  const partition = d3.partition()
      .size([height, width])
      .padding(1);

  // 找到最早的日期和最晚的日期，并分别向前和向后扩展一年
  const minDate = d3.min(data, d => d.date);
  const maxDate = d3.max(data, d => d.date);

  // 创建新的 Date 对象，分别向前和向后扩展一年 
  const extendedMinDate = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  const extendedMaxDate = new Date(maxDate.getFullYear() + 1, maxDate.getMonth(), maxDate.getDate());
    
  // 创建比例尺
  const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => Number(d['字数']))])
      .range([100, width+100]);
  
  const yScale = d3.scaleTime()
      .domain([extendedMinDate, extendedMaxDate])
      .range([margin.top, height - margin.bottom]); 
  
  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("width", width+100)
      .attr("height", height)
      .attr("viewBox", [0, 0, width+100, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif");

  // 添加时间线到左侧
  svg.append("g")
      .attr("transform", `translate(${margin.left},${0})`)  
      .call(d3.axisLeft(yScale).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat("%Y"))); // 格式化为年份;
  
  // 定义矩形绘制函数
  function drawRectangles() {
    const g = svg.append("g")
      .attr("transform", `translate(100,0)`); // 留出时间线的空间

    const rectangles = g.selectAll("rect")
      .data(data)
      .enter().append("rect")
      .attr("x", 0)
      .attr("y", d => yScale(d.date))
      .attr("width", d => xScale(Number(d['字数'])))
      .attr("height", (d, i, nodes) => {
        return i < data.length - 1 ? 
          Math.max(1, yScale(data[i + 1].date) - yScale(d.date)) : // 确保高度至少为1像素
          Math.max(1, height - margin.bottom - yScale(d.date));
      })
     .attr("fill", (d, i) => color(i)); // 使用颜色方案给每个作品分配颜色

    const textOffsets = data.map((_, i) => 0); // 每个标签向下偏移1像素
    textOffsets[4] = 1;
    textOffsets[5] = 2;
    textOffsets[17] = 2;
    textOffsets[23] = 2;
    textOffsets[26] = 2;
    textOffsets[27] = 4;
  // 添加标签
  g.selectAll("text")
    .data(data)
    .enter().append("text")
      .attr("x", 4)
      .attr("y", (d, i, nodes) => {
        const rectHeight = i < data.length - 1 ? 
          yScale(data[i + 1].date) - yScale(d.date) : 
          height - margin.bottom - yScale(d.date);
        // 垂直居中：矩形顶部位置加上矩形高度的一半，并调整文本基线
        return yScale(d.date) + rectHeight / 2+ textOffsets[i];
      })
      .attr("dy", "0.35em") // 调整文本基线以适应不同字体大小
      .attr("dominant-baseline", "central") // 文本垂直居中对齐
      .text(d => `${d['作品名称']}\n${d['字数']} 字`);
}
  

  drawRectangles(); 

   const startDate = d3.min(data, d => d.date);
   const endDate = extendedMaxDate;

  svg.append("text")
    .attr("class", "start-end-label")
    .attr("x", margin.left - 10) // 略微偏移以避免与时间线重叠
    .attr("y", yScale(startDate))
    .attr("dy", ".35em") // 调整垂直对齐
    .attr("text-anchor", "end") // 文本靠右对齐
    .text("1963");

  svg.append("text")
    .attr("class", "start-end-label")
    .attr("x", margin.left - 10) // 略微偏移以避免与时间线重叠
    .attr("y", yScale(endDate))
    .attr("dy", ".35em") // 调整垂直对齐
    .attr("text-anchor", "end") // 文本靠右对齐
    .text("2021");

// 定义一个函数来绘制弯曲箭头和标签
function addCurvedArrowAndLabel(svg, year, label, xOffset, yOffset) {
  const date = new Date(year, 0, 1); // 创建一个该年的1月1日日期对象
  const yPos = yScale(date);

  // 绘制弯曲箭头 (使用贝塞尔曲线)
  svg.append("path")
    .attr("d", `M${margin.left},${yPos} C${margin.left + xOffset/2 },${yPos} ${width + margin.left - xOffset / 2},${yPos - yOffset /5} ${xOffset},${yOffset}`)
    .attr("stroke", "red")
    .attr("fill", "none")
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrowhead)"); // 添加箭头

  // 添加标签
  svg.append("text")
    .attr("x", xOffset) // 放置在箭头末端旁边
    .attr("y", yOffset)
    .attr("dx", 10) // 标签距离箭头末端一点距离
    .attr("dy", ".35em")
    .attr("text-anchor", "start")
    .text(label);
}

// 定义箭头标记
svg.append("defs").append("marker")
  .attr("id", "arrowhead")
  .attr("viewBox", "0 0 10 10")
  .attr("refX", "5")
  .attr("refY", "5")
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M 0 0 L 10 5 L 0 10 Z")
  .attr("fill", "red");

// 添加指定的事件和标签
addCurvedArrowAndLabel(svg, 1979, "与平鑫涛结婚", 700, 550);
addCurvedArrowAndLabel(svg, 1988, "第一次回大陆", 700, 850);
  
  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["data@3.csv", {url: new URL("./files/d94b9ee0f22d5d0b75bc8f2c755bca671d29753fa9785a29cf84e71f73add4f137a8fa01e60778bb632cbd3dbbb8fed1ae49c87a8a3ad1b50883d1138b91c713.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer()).define(["data"], _3);
  main.variable(observer("chart")).define("chart", ["d3","data"], _chart);
  return main;
}
