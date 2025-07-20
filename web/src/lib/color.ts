export function colorStrToRgb(str: string) {
  const rgba: [r: number, g: number, b: number, a: number] = new Array(4) as any;
  if (str.startsWith("#")) {
    switch (str.length) {
      case 4:
        rgba[0] = parseInt(str[1] + str[1], 16);
        rgba[1] = parseInt(str[2] + str[2], 16);
        rgba[2] = parseInt(str[3] + str[3], 16);
        rgba[3] = 255;
        break;
      case 5:
        rgba[0] = parseInt(str[1] + str[1], 16);
        rgba[1] = parseInt(str[2] + str[2], 16);
        rgba[2] = parseInt(str[3] + str[3], 16);
        rgba[3] = parseInt(str[4] + str[4], 16);
        break;
      case 7:
        rgba[0] = parseInt(str[1] + str[2], 16);
        rgba[1] = parseInt(str[3] + str[4], 16);
        rgba[2] = parseInt(str[5] + str[6], 16);
        rgba[3] = 255;
        break;
      case 9:
        rgba[0] = parseInt(str[1] + str[2], 16);
        rgba[1] = parseInt(str[3] + str[4], 16);
        rgba[2] = parseInt(str[5] + str[6], 16);
        rgba[3] = parseInt(str[7] + str[8], 16);
        break;
      default:
        throw new Error("Invalid color format: " + str);
    }
  } else if (str.startsWith("rgb")) {
    const match = str.match(/rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(\d?\.?\d+))?\)/);
    if (match) {
      rgba[0] = parseInt(match[1], 10);
      rgba[1] = parseInt(match[2], 10);
      rgba[2] = parseInt(match[3], 10);
      rgba[3] = match[4] ? Math.round(parseFloat(match[4]) * 255) : 255;
    } else {
      throw new Error("Invalid color format: " + str);
    }
  } else {
    throw new Error("Invalid color format: " + str);
  }
  return rgba;
}
