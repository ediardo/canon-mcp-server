import Canon from "./Canon.js";
import fs from 'fs';
async function main() {
    const ipAddress = '10.0.0.241';
    const port = 8080;
    const https = false;
    ;
    const canon = new Canon(ipAddress, port, https);
    const x = await canon.connect();
    console.log(x);
    //const lastPhoto = await canon.getLastPhoto();
    //console.log(lastPhoto);
    // const liveView = await canon.startLiveView();
    // console.log(liveView);
    const res = await canon.getLiveViewImageFlipDetail("both");
    console.log(res);
    // save the jpeg to a file
    if (res.image) {
        fs.writeFileSync('./liveview.jpg', Buffer.from(res.image, 'base64'));
    }
    if (res.info) {
        console.log(res.info);
    }
}
main();
