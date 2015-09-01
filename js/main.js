var collage = {};
var collageModule;

collage.main = function() {
    var self = this;

    var stage = null; //will hold all canvas references
    var stageBounds = { width: 800, height: 600, midX: null, midY: null }
    var stageUpdate = false; //tells stage when to update

    var gridImg, gridBitmap = null; //perspective plane
    var gridBounds; //holds Y pos of grid

    //var organismImgArray = [];
    //var organismBitmapArray = [];
    var organismPath = 'img/animals/';
    var environmentPath = 'img/environment/';

    var envForeground = null; //ref to the foreground bitmap
    var envBackground = null; //ref to the background bitmap

    var editItem; //reference to the bitmap being manipulated
    var editMode; //scale, move, etc
    var blurFilter = null;


    self.init = function() {
        initStage();
    }

    var initStage = function(){
        stage = new createjs.Stage("collageCanvas");
        stageBounds.midX = stageBounds.width/2;
        stageBounds.midY = stageBounds.height/2;

        if (createjs.Touch.isSupported()) {
            createjs.Touch.enable(stage);
        }

        loadGrid();
    }

    var loadGrid = function(){
        gridImg = new Image();
        gridImg.src = "img/environment/perspective-grid.png";

        $(gridImg).load(function(){
            drawGrid();
        });
    }

    var drawGrid = function(){
        gridBitmap = new createjs.Bitmap(gridImg);
        stage.addChild(gridBitmap);
        gridBounds = gridBitmap.getBounds();
        gridBounds.y = stageBounds.height - gridBounds.height;
        gridBitmap.x = 0;
        gridBitmap.y = gridBounds.y;
        stage.update();
        addTick();
        addFilters();
        addControlsListeners();
    }

    var addFilters = function(){
        blurFilter = new createjs.BlurFilter(0, 0, 2); //x,y,quality (1,2,3,etc);
    }

    var loadOrganism = function(src){
        var orgImg = new Image();
        orgImg.src = src;

        $(orgImg).load(function(){
            //organismImgArray.push(orgImg);
            drawOrganism(orgImg);
        });
    }

    var loadEnvironment = function(src,type){
        var envImg = new Image();
        envImg.src = src;

        $(envImg).load(function(){
            drawEnvironment(envImg,type);
        });
    }

    var drawOrganism = function(orgimg){
        var orgBitmap = new createjs.Bitmap(orgimg);
        orgBitmap.cache(0, 0, orgimg.width, orgimg.height);
        stage.addChild(orgBitmap);
        self.centerElement(orgBitmap);
        //editItem = orgBitmap;
        addBitmapListeners(orgBitmap);
        //organismBitmapArray.push(orgBitmap);
        stageUpdate = true;
    }

    var drawEnvironment = function(envImg,type){
        var envBitmap = new createjs.Bitmap(envImg);
        switch (type){
            case 'foreground':
                envBitmap.y = gridBounds.y;
                if (envForeground != null){
                    stage.removeChild(envForeground);
                }
                envForeground = envBitmap;
                stage.addChild(envBitmap);
                stage.setChildIndex( envBitmap, 0);
                break;
            case 'background':
                envBitmap.y = 0;
                if (envBackground != null){
                    stage.removeChild(envBackground);
                }
                envBackground = envBitmap;
                stage.addChild(envBitmap);
                stage.setChildIndex( envBitmap, 1);
                break;
        }

        //addBitmapListeners(orgBitmap);
        stageUpdate = true;
    }

    var addBitmapListeners = function(bitmap){
        bitmap.on("mousedown", onBitmapDown);
        bitmap.on('click',toggleBitmapManipulation);
        bitmap.on("pressmove",onDragBitmap);
        bitmap.on('pressup',onDragUp);
    }

    var addTick = function(){
        createjs.Ticker.addEventListener("tick", onTick);
    }

    var addControlsListeners = function(){
        $('.scale').on('input',onScaleChange);
        $('.blur').on('input',onBlurChange);
        $('.rotate').on('input',onRotateChange);
        $('.front').on('click',onFrontClick);
        $('.remove').on('click',onRemoveClick);
        $('.item').on('click',onItemClick);
        $('.environment').on('click',onEnvironmentClick);
        $('.save').on('click',onSaveClick);
    }

    var onItemClick = function(){
        var $thisItem = $(this);
        var thisURL = $thisItem.attr('data-url');
        var thisImageURL = organismPath + thisURL;
        loadOrganism(thisImageURL);
    }

    var onEnvironmentClick = function(){
        var $thisItem = $(this);
        var thisURL = $thisItem.attr('data-url');
        if (thisURL == ""){
            removeForeground();
        } else {
            var thisType = $thisItem.attr('data-type');
            var thisImageURL = environmentPath + thisURL;
            loadEnvironment(thisImageURL,thisType);
        }
    }

    var onBitmapDown = function(e){
        //this.parent.addChild(this); //MH - will move to front of z order
        this.offset = {x: this.x - e.stageX, y: this.y - e.stageY};
    }

    var onDragBitmap = function(e){
        if (this.editable){
            this.dragging = true;
            this.x = e.stageX + this.offset.x;
            this.y = e.stageY + this.offset.y;
            stageUpdate = true;
        }

    }

    var onDragUp = function(){
        this.dragging = false;
    }

    var onScaleChange = function(){
        if (editItem.editable){
            var $thisSlider = $(this);
            var thisVal = $thisSlider.val();
            editItem.scaleX = editItem.scaleY = thisVal;
            stageUpdate = true;
        }

    }

    var onFrontClick = function(){
        bringToFront(editItem);
    }

    var onRemoveClick = function(){
        var itemToRemove = editItem;
        editItem = null;
        itemToRemove.removeAllEventListeners();
        stage.removeChild(itemToRemove); //MH - need to first remove item and image from array (or delete arrays if they're not being used)
    }

    var removeForeground = function(){
        envForeground = null;
        stage.removeChildAt(0);
    }

    var onBlurChange = function(){

        if (editItem != null && editItem.editable){
            var $thisSlider = $(this);
            var thisVal = $thisSlider.val();

            if (editItem.filters == null){
                editItem.filters = [blurFilter];
            }

            editItem.filters[0].blurX = editItem.filters[0].blurY = thisVal;

            stageUpdate = true;
            editItem.updateCache();
        }

    }

    var onRotateChange = function(){
        if (editItem != null && editItem.editable){
            var $thisSlider = $(this);
            var thisVal = $thisSlider.val();
            editItem.rotation = thisVal;
            stageUpdate = true;
        }
    }

    var toggleBitmapManipulation = function(e){

        if (editItem && editItem.id != this.id){ //we are switching to a new item
            editItem.editable = false;
            removeGlow(editItem);
            editItem = this;
            adjustSliderValues();
        }

        if (this.editable){ //item is editable if it has been selected
            if (!this.dragging){
                this.editable = false;
                removeGlow(this);
                editItem = null;
            }
        } else {
            editItem = this;
            this.editable = true;
            addGlow(this);
        }
    }

    var adjustSliderValues = function(){
        var thisScale = editItem.scaleX;
        var thisRotation = editItem.rotation;
        if (editItem.filters !== null){
            var thisBlur = editItem.filters[0].blurX;
        } else {
            var thisBlur = 0;
        }
        $('.scale').val(thisScale);
        $('.blur').val(thisBlur);
        $('.rotate').val(thisRotation);
    }

    var addGlow = function(bitmap){
         bitmap.shadow = new createjs.Shadow("#ff0000", 0, 0, 5);
         stageUpdate = true;
    }

    var removeGlow = function(bitmap){
        bitmap.shadow = null;
        stageUpdate = true;
    }

    self.centerElement = function(el){
        el.regX = el.image.width >> 1;
        el.regY = el.image.height >> 1;
        el.x = stageBounds.width >> 1;
        el.y = stageBounds.height >> 1;
    }

    var bringToFront = function(obj){
        stage.setChildIndex( obj, stage.getNumChildren()-1);
    }

    var onTick = function(event) {
        if (stageUpdate) {
            !stageUpdate; // only update once
            stage.update(event);
        }
    }

    var onSaveClick = function(){
        var collage = document.getElementById("collageCanvas");
        var collageImg = convertCanvasToImage(collage);
        $('.image-container').html(collageImg);
        //saveImageToDrive();
    }

    var saveImageToDrive = function(){
        var url = 'save.php',
        data = $('.image-container').find('img').attr('src');

        $.ajax({
            type: "POST",
            url: url,
            dataType: 'text',
            data: {
                base64data : data
            }
        });
    }

    var convertCanvasToImage = function(canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        return image;
    }

};

$(document).ready(function(){
    collageModule= new collage.main();
    collageModule.init();
});


