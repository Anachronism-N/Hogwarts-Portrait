# 字体使用说明

这个目录用于存放项目中使用的自定义字体文件。

## 字体文件存放

将字体文件（通常是 `.ttf`, `.woff`, `.woff2`, `.eot` 等格式）直接放在此目录下。

## 在HTML中引入字体

要在HTML页面中使用这些字体，请按照以下步骤操作：

### 1. 在HTML的`<head>`部分添加`@font-face`规则

```html
<style>
    @font-face {
        font-family: 'YourFontName';
        src: url('../fonts/your-font-file.ttf') format('truetype');
        /* 添加其他格式的字体文件以确保兼容性 */
        /* src: url('../fonts/your-font-file.woff2') format('woff2'),
             url('../fonts/your-font-file.woff') format('woff'); */
        font-weight: normal;
        font-style: normal;
    }
</style>
```

### 2. 在CSS中使用字体

```html
<style>
    .your-element {
        font-family: 'YourFontName', sans-serif;
    }
</style>
```

## 示例：在page3.html中使用自定义字体

如果要在page3.html中使用自定义字体显示API返回的消息，可以修改`chat-api.js`文件中的`positionTextInChatBox`函数，或者直接在HTML的`<head>`中添加样式。

```html
<!-- 在page3.html的<head>中添加 -->
<style>
    /* 定义字体 */
    @font-face {
        font-family: 'BarbieFont';
        src: url('../fonts/barbie-font.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }
    
    /* 应用于对话框文本 */
    #ken-chat div,
    #barbie-chat div {
        font-family: 'BarbieFont', sans-serif;
    }
</style>
```

## 注意事项

1. 确保字体文件的路径正确，相对于HTML文件的位置
2. 为了跨浏览器兼容性，建议提供多种格式的字体文件
3. 确保你有使用这些字体的合法权限
4. 字体文件可能会影响页面加载速度，建议使用压缩格式（如woff2）