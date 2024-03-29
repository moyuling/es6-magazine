/**
 * 创建数据
 * @return {[type]} [description]
 */
export function createData(outputPara,scrollPaintingMode,calculate) {
    var item,
        field,
        source = [],
        images = Xut.data['Image'],
        token  = null,
        items  = outputPara.source;

    for (item in items) {
        if (items.hasOwnProperty(item)) {
            field = {};
            token = images.item((parseInt(items[item]) || 1) - 1);
            field['img'] = token.md5;
            field['thumb'] = '';
            field['title'] = token.imageTitle;
            source.push(field);
        }
    }

    outputPara.source             = source;
    outputPara.scrollPaintingMode = scrollPaintingMode;
    outputPara.calculate          = calculate;

    return outputPara;
}
