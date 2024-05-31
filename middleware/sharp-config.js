const sharp = require('sharp');
const path = require('path');

module.exports = (req, res, next) => {
    try{
        const { buffer, originalname } = req.file;
        const timestamp = new Date().toISOString();
        const ref = `${timestamp}-${originalname}.webp`;
        let filePath = path.join(__dirname, '../images/'+ref);
        sharp(buffer)
            .webp({ quality: 20 })
            .toFile(filePath)
            .then(
                () => next()
            );
    }catch(error){
        res.status(500).json({error});
    }
}