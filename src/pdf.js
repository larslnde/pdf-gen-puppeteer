// src/pdf.js

// this module will be provided by the layer
const chromeLambda = require("chrome-aws-lambda");

// aws-sdk is always preinstalled in AWS Lambda in all Node.js runtimes
const S3Client = require("aws-sdk/clients/s3");
const AWS = require('aws-sdk')

// create an S3 client
const s3 = new S3Client({ region: process.env.S3_REGION });
const ses = new AWS.SES({region: 'eu-west-2'});

// default browser viewport size
const defaultViewport = {
  width: 1440,
  height: 1080
};

// here starts our function!
exports.handler = async event => {

  // launch a headless browser
  const browser = await chromeLambda.puppeteer.launch({
    args: chromeLambda.args,
    executablePath: await chromeLambda.executablePath,
    defaultViewport 
  });


  // open a new tab
  const page = await browser.newPage();

  // navigate to the page
  await page.goto('https://jsonplaceholder.typicode.com/todos/1', {
    waitUntil: ["networkidle0", "load", "domcontentloaded"]
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