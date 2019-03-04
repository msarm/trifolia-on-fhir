"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Date.prototype.formatFhir = function () {
    const date = this;
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    const year = date.getFullYear();
    if (month.length < 2) {
        month = '0' + month;
    }
    if (day.length < 2) {
        day = '0' + day;
    }
    return [year, month, day].join('-');
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS1leHRlbnNpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGF0ZS1leHRlbnNpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUc7SUFDeEIsTUFBTSxJQUFJLEdBQVMsSUFBSSxDQUFDO0lBQ3hCLElBQUksS0FBSyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUN2QyxJQUFJLEdBQUcsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUVoQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ2xCLEtBQUssR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDO0tBQ3ZCO0lBRUQsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNoQixHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztLQUNuQjtJQUVELE9BQU8sQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN4QyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQge307XHJcblxyXG5kZWNsYXJlIGdsb2JhbCB7XHJcbiAgICBpbnRlcmZhY2UgRGF0ZSB7XHJcbiAgICAgICAgZm9ybWF0RmhpcigpOiBzdHJpbmc7XHJcbiAgICB9XHJcbn1cclxuXHJcbkRhdGUucHJvdG90eXBlLmZvcm1hdEZoaXIgPSBmdW5jdGlvbigpIHtcclxuICAgIGNvbnN0IGRhdGU6IERhdGUgPSB0aGlzO1xyXG4gICAgbGV0IG1vbnRoID0gJycgKyAoZGF0ZS5nZXRNb250aCgpICsgMSk7XHJcbiAgICBsZXQgZGF5ID0gJycgKyBkYXRlLmdldERhdGUoKTtcclxuICAgIGNvbnN0IHllYXIgPSBkYXRlLmdldEZ1bGxZZWFyKCk7XHJcblxyXG4gICAgaWYgKG1vbnRoLmxlbmd0aCA8IDIpIHtcclxuICAgICAgICBtb250aCA9ICcwJyArIG1vbnRoO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXkubGVuZ3RoIDwgMikge1xyXG4gICAgICAgIGRheSA9ICcwJyArIGRheTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW3llYXIsIG1vbnRoLCBkYXldLmpvaW4oJy0nKTtcclxufVxyXG4iXX0=