// src/pdf.js

// this module will be provided by the layer
const chromeLambda = require("chrome-aws-lambda");

// aws-sdk is always preinstalled in AWS Lambda in all Node.js runtimes
const S3Client = require("aws-sdk/clients/s3");
const AWS = require('aws-sdk')

// create an S3 client
const s3 = new S3Client({ region: process.env.S3_REGION });
const ses = new AWS.SES({region: 'eu-west-2'});

//other requirements
const fs = require("fs");
const handlebars = require("handlebars");
const path = require("path");

const data = {
	title: "A new Brazilian School",
	date: "05/12/2018",
	name: "Rodolfo Luis Marcos",
	age: 28,
	birthdate: "12/07/1990",
	course: "Computer Science",
	obs: "Graduated in 2014 by Federal University of Lavras, work with Full-Stack development and E-commerce."
}

//Handlebars items
//var templateHtml = fs.readFileSync(path.join(process.cwd(), 'template.html'), 'utf8');

//something about line1 below breaks the template and pdf
var templateHtml = fs.readFileSync(path.resolve(__dirname + '/template.html'), 'utf8');
var template = handlebars.compile(templateHtml);
var html = template(data);

//this was just to test, works.
// const testhtml = '<div class="report-body"><div class="info"> <p>Student: {{name}}</p></div></div>';
// var template = handlebars.compile(testhtml);
// var html = template(data);



// here starts our function!
exports.handler = async event => {

  // launch a headless browser
  const browser = await chromeLambda.puppeteer.launch({
    args: chromeLambda.args,
    executablePath: await chromeLambda.executablePath 
  });


  // open a new tab
  const page = await browser.newPage();

  // navigate to the page
  await page.goto(`data:text/html;charset=UTF-8,${html}`, {
    // waitUntil: ["networkidle0", "load", "domcontentloaded"]
    waitUntil: ["networkidle0"]
  });

  // take a screenshot
  //const buffer = await page.screenshot()

  // upload the image using the current timestamp as filename
//   const result = await s3
//     .upload({
//       Bucket: process.env.S3_BUCKET,
//       Key: `${Date.now()}.png`,
//       Body: buffer,
//       ContentType: "image/png",
//       ACL: "public-read"
//     })
//     .promise();

    var options = {
    width: '1230px',
    headerTemplate: "<p></p>",
    footerTemplate: "<p></p>",
    displayHeaderFooter: false,
    margin: {
        top: "10px",
        bottom: "30px"
    },
    printBackground: true,
    }

    //generate pdf
    const buffer = await page.pdf(options)

    //upload pdf
    const result = await s3
    .upload({
        Bucket: process.env.S3_BUCKET,
        Key: `${Date.now()}.pdf`,
        Body: buffer,
        ContentType: "application/pdf",
        ACL: "public-read"
    })
    .promise();



  // return the uploaded image url
  return { url: result.Location };
};

