const axios = require('axios');
// 根据ip获取定位信息
const getInfoByIp = function (ip) {
    return axios.get(`https://restapi.amap.com/v5/ip?key=a08fb4c834dc0c28ccd6f75b83d028c8&ip=${ip}&type=4`).then(response => {
        response = response.data;
        if (response.status === '1') {
            return {
                country: response.country,
                province: response.province,
                city: response.city,
                district: response.district,
                isp: response.isp,
                location: response.location,
                ip: response.ip
            };
        } else {
            console.log(chalk.red(`STATUS_ERROR - fn:${arguments.callee.name}`));
        }
    }, error => {
        console.log(chalk.red(`ERROR - fn:${arguments.callee.name}`));
    });
};

// 根据经纬度信息获取街道信息
const getInfoByLocation = function (location) {
    return axios.get(`https://restapi.amap.com/v3/geocode/regeo?key=a08fb4c834dc0c28ccd6f75b83d028c8&location=${location}`).then(response => {
        response = response.data;
        if (response.status === '1') {
            locationData = response.regeocode.addressComponent;
            return {
                country: locationData.country,
                province: locationData.province,
                city: locationData.city,
                district: locationData.district,
                township: locationData.township,
                formatted_address: response.regeocode.formatted_address
            };
        } else {
            console.log(chalk.red(`STATUS_ERROR - fn:${arguments.callee.name}`));
        }
    }, error => {
        console.log(chalk.red(`ERROR - fn:${arguments.callee.name}`));
    });
};

module.exports = {
    getInfoByIp,
    getInfoByLocation
}