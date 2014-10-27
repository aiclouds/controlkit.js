var EventDispatcher = require('./event/EventDispatcher');
var Default = require('./Default');
var Node = require('./document/Node');
var NodeType = require('./document/NodeType');
var NodeEventType = require('./document/NodeEventType');
var CSS = require('./document/CSS');
var LayoutMode = require('./layout/LayoutMode');
var History = require('./History');
var DocumentEventType = require('./document/DocumentEventType');
var Group = require('./group/Group');
var Event_ = require('./event/Event');
var Mouse = require('./document/Mouse');
var ScrollBar = require('./layout/ScrollBar');
var EventType = require('./event/EventType');

function Panel(controlKit,params)
{
    EventDispatcher.apply(this,arguments);

    /*---------------------------------------------------------------------------------*/

    this._parent = controlKit;

    /*---------------------------------------------------------------------------------*/

    params            = params           || {};

    params.valign     = params.valign    || Default.PANEL_VALIGN;
    params.align      = params.align     || Default.PANEL_ALIGN;
    params.position   = params.position  || Default.PANEL_POSITION;
    params.width      = params.width     || Default.PANEL_WIDTH;
    params.height     = params.height    || Default.PANEL_HEIGHT;
    params.ratio      = params.ratio     || Default.PANEL_RATIO;
    params.label      = params.label     || Default.PANEL_LABEL;
    params.opacity    = params.opacity   || Default.PANEL_OPACITY;
    params.fixed      = params.fixed      === undefined ? Default.PANEL_FIXED      : params.fixed;
    params.enable     = params.enable     === undefined ? Default.PANEL_ENABLE     : params.enable;
    params.vconstrain = params.vconstrain === undefined ? Default.PANEL_VCONSTRAIN : params.vconstrain;

    if(params.dock)
    {
        params.dock.align     = params.dock.align     || Default.PANEL_DOCK.align;
        params.dock.resizable = params.dock.resizable || Default.PANEL_DOCK.resizable;
    }

    /*---------------------------------------------------------------------------------*/

    this._width      = Math.max(Default.PANEL_WIDTH_MIN,
                       Math.min(params.width,Default.PANEL_WIDTH_MAX));
    this._height     = params.height ?  Math.max(0,Math.min(params.height,window.innerHeight)) : null;
    this._fixed      = params.fixed;
    this._dock       = params.dock;
    this._position   = params.position;
    this._vConstrain = params.vconstrain;
    this._label      = params.label;
    this._isDisabled = !params.enable;
    this._groups     = [];

    /*---------------------------------------------------------------------------------*/

    var width    = this._width,
        isFixed  = this._fixed,
        dock     = this._dock,
        position = this._position,
        label    = this._label,
        align    = params.align,
        opacity  = params.opacity;

    /*---------------------------------------------------------------------------------*/

    var rootNode  = this._node     = new Node(NodeType.DIV),
        headNode  = this._headNode = new Node(NodeType.DIV),
        menuNode  =                  new Node(NodeType.DIV),
        lablWrap  =                  new Node(NodeType.DIV),
        lablNode  =                  new Node(NodeType.SPAN),
        wrapNode  = this._wrapNode = new Node(NodeType.DIV),
        listNode  = this._listNode = new Node(NodeType.LIST);

        rootNode.setStyleClass(CSS.Panel);
        headNode.setStyleClass(CSS.Head);
        menuNode.setStyleClass(CSS.Menu);
        lablWrap.setStyleClass(CSS.Wrap);
        lablNode.setStyleClass(CSS.Label);
        wrapNode.setStyleClass(CSS.Wrap);
        listNode.setStyleClass(CSS.GroupList);

        rootNode.setWidth(width);
        lablNode.setProperty('innerHTML',label);

        headNode.addChild(menuNode);
        lablWrap.addChild(lablNode);
        headNode.addChild(lablWrap);
        wrapNode.addChild(listNode);
        rootNode.addChild(headNode);
        rootNode.addChild(wrapNode);

        controlKit.getNode().addChild(rootNode);

    /*---------------------------------------------------------------------------------*/

    if(!dock)
    {

        var menuHide  = this._menuHide = new Node(NodeType.INPUT_BUTTON);
            menuHide.setStyleClass( CSS.MenuBtnHide);
            menuHide.addEventListener( NodeEventType.MOUSE_DOWN, this._onMenuHideMouseDown.bind(this));

        menuNode.addChild(menuHide);

        if(this._parent.panelsAreClosable())
        {
            var menuClose = new Node(NodeType.INPUT_BUTTON);
            menuClose.setStyleClass(CSS.MenuBtnClose);
            menuClose.addEventListener(NodeEventType.MOUSE_DOWN, this.disable.bind(this));

            menuNode.addChild(menuClose);
        }


        if(this.hasMaxHeight()){this._addScrollWrap();}

        if(!isFixed)
        {
            if(position)
            {
                if(align == LayoutMode.LEFT ||
                   align == LayoutMode.TOP  ||
                   align == LayoutMode.BOTTOM)
                {
                    rootNode.setPositionGlobal(position[0],position[1]);
                }
                else
                {
                    rootNode.setPositionGlobal(window.innerWidth - width - position[0],position[1]);
                    this._position = rootNode.getPosition();
                }
            }
            else this._position = rootNode.getPosition();

            this._mouseOffset  = [0,0];

            rootNode.setStyleProperty('position','absolute');
            headNode.addEventListener(NodeEventType.MOUSE_DOWN,this._onHeadDragStart.bind(this));
        }
        else
        {
            if(position)
            {
                var positionX = position[0],
                    positionY = position[1];

                if(positionY != 0)rootNode.setPositionY(positionY);
                if(positionX != 0)if(align==LayoutMode.RIGHT)rootNode.getElement().marginRight = positionX;
                                  else rootNode.setPositionX(positionX);
            }

            rootNode.setStyleProperty('float',align);
        }
    }
    else
    {
        var dockAlignment = dock.align;

        if(dockAlignment == LayoutMode.LEFT ||
           dockAlignment == LayoutMode.RIGHT)
        {
            align = dockAlignment;
            this._height = window.innerHeight;
        }

        if(dockAlignment == LayoutMode.TOP ||
           dockAlignment == LayoutMode.BOTTOM)
        {

        }

        /*
        if(dock.resizable)
        {
            var sizeHandle = new ControlKit.Node(ControlKit.NodeType.DIV);
                sizeHandle.setStyleClass(ControlKit.CSS.SizeHandle);
                rootNode.addChild(sizeHandle);
        }
        */

        rootNode.setStyleProperty('float',align);

    }

    if(this._parent.historyIsEnabled())
    {
        var menuUndo = this._menuUndo = new Node(NodeType.INPUT_BUTTON);
            menuUndo.setStyleClass(CSS.MenuBtnUndo);
            menuUndo.setStyleProperty('display','none');
            menuUndo.setProperty('value',History.getInstance().getNumStates());
            menuNode.addChildAt(menuUndo,0);

            menuUndo.addEventListener(NodeEventType.MOUSE_DOWN, this._onMenuUndoTrigger.bind(this));
            headNode.addEventListener(NodeEventType.MOUSE_OVER, this._onHeadMouseOver.bind(this));
            headNode.addEventListener(NodeEventType.MOUSE_OUT,  this._onHeadMouseOut.bind(this))
    }

    /*---------------------------------------------------------------------------------*/

    if(opacity != 1.0 && opacity != 0.0){rootNode.setStyleProperty('opacity',opacity);}

    /*---------------------------------------------------------------------------------*/

    this._parent.addEventListener(EventType.UPDATE_MENU,      this, 'onUpdateMenu');
    window.addEventListener(DocumentEventType.WINDOW_RESIZE,this._onWindowResize.bind(this));
}

Panel.prototype = Object.create(EventDispatcher.prototype);

/*---------------------------------------------------------------------------------*/

Panel.prototype.addGroup  = function(params)
{
    var group = new Group(this,params);
    this._groups.push(group);
    if(this.isDocked())this.dispatchEvent(new Event_(this,EventType.PANEL_SIZE_CHANGE));
    return group;
};

/*---------------------------------------------------------------------------------*/

Panel.prototype._onMenuHideMouseDown = function()
{
    this._isDisabled = !this._isDisabled;
    this._updateAppearance();
};

Panel.prototype._updateAppearance = function()
{
    var rootNode = this._node,
        headNode = this._headNode,
        menuHide = this._menuHide;

    if(this._isDisabled)
    {
        headNode.getStyle().borderBottom = 'none';

        rootNode.setHeight(headNode.getHeight());
        menuHide.setStyleClass(CSS.MenuBtnShow);

        this.dispatchEvent(new Event_(this,EventType.PANEL_HIDE,null));
    }
    else
    {
        rootNode.setHeight(headNode.getHeight() +  this._wrapNode.getHeight());
        rootNode.deleteStyleProperty('height');
        menuHide.setStyleClass(CSS.MenuBtnHide);
        headNode.setStyleClass(CSS.Head);

        this.dispatchEvent(new Event_(this,EventType.PANEL_SHOW,null));
    }
};

Panel.prototype._onHeadMouseOver   = function(){this._menuUndo.setStyleProperty('display','inline')};
Panel.prototype._onHeadMouseOut    = function(){this._menuUndo.setStyleProperty('display','none')};
Panel.prototype.onUpdateMenu       = function(){this._menuUndo.setProperty('value',History.getInstance().getNumStates());};

Panel.prototype._onMenuUndoTrigger = function(){History.getInstance().popState();};

/*---------------------------------------------------------------------------------*
* Panel dragging
*----------------------------------------------------------------------------------*/

Panel.prototype._onHeadDragStart = function()
{
    var parentNode = this._parent.getNode(),
        node       = this._node;

    var nodePos   = node.getPositionGlobal(),
        mousePos  = Mouse.getInstance().getPosition(),
        offsetPos = this._mouseOffset;

        offsetPos[0] = mousePos[0] - nodePos[0];
        offsetPos[1] = mousePos[1] - nodePos[1];

    var eventMouseMove = DocumentEventType.MOUSE_MOVE,
        eventMouseUp   = DocumentEventType.MOUSE_UP;

    var self = this;

    var onDrag    = function()
                    {
                        self._updatePosition();
                    },

        onDragEnd = function()
                    {
                        document.removeEventListener(eventMouseMove, onDrag,    false);
                        document.removeEventListener(eventMouseUp,   onDragEnd, false);
                        self.dispatchEvent(new Event_(this,EventType.PANEL_MOVE_END,null));
                    };

    parentNode.removeChild(node);
    parentNode.addChild(   node);

    document.addEventListener(eventMouseMove, onDrag,    false);
    document.addEventListener(eventMouseUp,   onDragEnd, false);

    this.dispatchEvent(new Event_(this,EventType.PANEL_MOVE_BEGIN,null));
};

Panel.prototype._updatePosition = function()
{
    var mousePos  = Mouse.getInstance().getPosition(),
        offsetPos = this._mouseOffset;

    var position = this._position;
        position[0] = mousePos[0] - offsetPos[0];
        position[1] = mousePos[1] - offsetPos[1];

    this._constrainHeight();
    this._constrainPosition();

    this.dispatchEvent(new Event_(this,EventType.PANEL_MOVE,null));
};

Panel.prototype._onWindowResize = function()
{
    if(this.isDocked())
    {
        var dock = this._dock;

        if(dock.align == LayoutMode.RIGHT ||
           dock.align == LayoutMode.LEFT )
        {
            var windowHeight = window.innerHeight,
                listHeight   = this._listNode.getHeight(),
                headHeight   = this._headNode.getHeight();

            this._height = windowHeight;

            if((windowHeight - headHeight) > listHeight)this._scrollBar.disable();
            else this._scrollBar.enable();

            this.dispatchEvent(new Event_(this,EventType.PANEL_SIZE_CHANGE));
        }
    }
    else
    {
        if(!this.isFixed())this._constrainPosition();
    }

    this._constrainHeight();

    this.dispatchEvent(new Event_(this,EventType.WINDOW_RESIZE));
};


/*---------------------------------------------------------------------------------*/

Panel.prototype._constrainPosition = function()
{
    var node = this._node;

    var maxX = window.innerWidth  - node.getWidth(),
        maxY = window.innerHeight - node.getHeight();

    var position    = this._position;
        position[0] = Math.max(0,Math.min(position[0],maxX));
        position[1] = Math.max(0,Math.min(position[1],maxY));

    node.setPositionGlobal(position[0],position[1]);
};

Panel.prototype._constrainHeight = function()
{
    if(!this._vConstrain)return;

    var hasMaxHeight  = this.hasMaxHeight(),
        hasScrollWrap = this.hasScrollWrap();

    var headNode      = this._headNode,
        wrapNode      = this._wrapNode;

    var scrollBar     = this._scrollBar;

    var panelTop      = this.isDocked() ? 0 :
                        this.isFixed()  ? 0 :
                        this._position[1];

    var panelHeight   = hasMaxHeight  ? this.getMaxHeight() :
                        hasScrollWrap ? scrollBar.getTargetNode().getHeight() :
                        wrapNode.getHeight();

    var panelBottom   = panelTop + panelHeight;
    var headHeight    = headNode.getHeight();

    var windowHeight  = window.innerHeight,
        heightDiff    = windowHeight - panelBottom - headHeight,
        heightSum;

    if(heightDiff < 0.0)
    {
        heightSum = panelHeight + heightDiff;

        if(!hasScrollWrap)
        {
            this._addScrollWrap(heightSum);
            this.dispatchEvent(new Event_(this,EventType.PANEL_SCROLL_WRAP_ADDED, null));
            return;
        }

        scrollBar.setWrapHeight(heightSum);
        wrapNode.setHeight(heightSum);
    }
    else
    {
        if(!hasMaxHeight && hasScrollWrap)
        {
            scrollBar.removeFromParent();
            wrapNode.addChild(this._listNode);
            wrapNode.deleteStyleProperty('height');

            this._scrollBar = null;

            this.dispatchEvent(new Event_(this,EventType.PANEL_SCROLL_WRAP_REMOVED, null));
        }
    }
};

/*---------------------------------------------------------------------------------*/

Panel.prototype.onGroupListSizeChange = function()
{
    if(this.hasScrollWrap())this._updateScrollWrap();
    this._constrainHeight();
};

Panel.prototype._updateScrollWrap = function()
{
    var wrapNode   = this._wrapNode,
        scrollBar  = this._scrollBar,
        height     = this.hasMaxHeight() ?
            this.getMaxHeight() : 100,
        listHeight = this._listNode.getHeight();

    wrapNode.setHeight(listHeight < height ? listHeight : height);

    scrollBar.update();

    if (!scrollBar.isValid())
    {
        scrollBar.disable();
        wrapNode.setHeight(wrapNode.getChildAt(1).getHeight());
    }
    else
    {
        scrollBar.enable();
        wrapNode.setHeight(height);
    }
};

Panel.prototype._addScrollWrap = function()
{
    var wrapNode = this._wrapNode,
        listNode = this._listNode,
        height   = arguments.length == 0 ?
                   this.getMaxHeight() :
                   arguments[0];

    this._scrollBar = new ScrollBar(wrapNode,listNode,height);
    if(this.isEnabled())wrapNode.setHeight(height);
};

Panel.prototype.hasScrollWrap = function()
{
    return this._scrollBar != null;
};

/*---------------------------------------------------------------------------------*/

Panel.prototype.preventSelectDrag = function()
{
    if(!this.hasScrollWrap())return;
    this._wrapNode.getElement().scrollTop = 0;
};

/*---------------------------------------------------------------------------------*/

Panel.prototype.enable  = function()
{
    this._node.setStyleProperty('display','block');
    this._isDisabled = false;
    this._updateAppearance();
};

Panel.prototype.disable = function()
{
    this._node.setStyleProperty('display','none');
    this._isDisabled = true;
    this._updateAppearance();
};

Panel.prototype.isEnabled  = function(){return !this._isDisabled;};
Panel.prototype.isDisabled = function(){return this._isDisabled;};

/*---------------------------------------------------------------------------------*/

Panel.prototype.hasMaxHeight  = function(){return this._height != null;};
Panel.prototype.getMaxHeight  = function(){return this._height;};

Panel.prototype.isDocked      = function(){return this._dock;};
Panel.prototype.isFixed       = function(){return this._fixed;};

/*---------------------------------------------------------------------------------*/

Panel.prototype.getGroups     = function(){return this._groups;};
Panel.prototype.getNode       = function(){return this._node;};
Panel.prototype.getList       = function(){return this._listNode;};

/*---------------------------------------------------------------------------------*/

Panel.prototype.getWidth      = function(){return this._width;};
Panel.prototype.getPosition   = function(){return this._position;};

Panel.prototype.getParent = function(){
    return this._parent;
};

module.exports = Panel;

//ControlKit.Panel = function(controlKit,params)
//{
//    ControlKit.EventDispatcher.apply(this,arguments);
//
//    /*---------------------------------------------------------------------------------*/
//
//    this._parent = controlKit;
//
//    /*---------------------------------------------------------------------------------*/
//
//    params            = params           || {};
//
//    params.valign     = params.valign    || ControlKit.Default.PANEL_VALIGN;
//    params.align      = params.align     || ControlKit.Default.PANEL_ALIGN;
//    params.position   = params.position  || ControlKit.Default.PANEL_POSITION;
//    params.width      = params.width     || ControlKit.Default.PANEL_WIDTH;
//    params.height     = params.height    || ControlKit.Default.PANEL_HEIGHT;
//    params.ratio      = params.ratio     || ControlKit.Default.PANEL_RATIO;
//    params.label      = params.label     || ControlKit.Default.PANEL_LABEL;
//    params.opacity    = params.opacity   || ControlKit.Default.PANEL_OPACITY;
//    params.fixed      = params.fixed      === undefined ? ControlKit.Default.PANEL_FIXED      : params.fixed;
//    params.enable     = params.enable     === undefined ? ControlKit.Default.PANEL_ENABLE     : params.enable;
//    params.vconstrain = params.vconstrain === undefined ? ControlKit.Default.PANEL_VCONSTRAIN : params.vconstrain;
//
//    if(params.dock)
//    {
//        params.dock.align     = params.dock.align     || ControlKit.Default.PANEL_DOCK.align;
//        params.dock.resizable = params.dock.resizable || ControlKit.Default.PANEL_DOCK.resizable;
//    }
//
//    /*---------------------------------------------------------------------------------*/
//
//    this._width      = Math.max(ControlKit.Default.PANEL_WIDTH_MIN,
//                       Math.min(params.width,ControlKit.Default.PANEL_WIDTH_MAX));
//    this._height     = params.height ?  Math.max(0,Math.min(params.height,window.innerHeight)) : null;
//    this._fixed      = params.fixed;
//    this._dock       = params.dock;
//    this._position   = params.position;
//    this._vConstrain = params.vconstrain;
//    this._label      = params.label;
//    this._isDisabled = !params.enable;
//    this._groups     = [];
//
//    /*---------------------------------------------------------------------------------*/
//
//    var width    = this._width,
//        isFixed  = this._fixed,
//        dock     = this._dock,
//        position = this._position,
//        label    = this._label,
//        align    = params.align,
//        opacity  = params.opacity;
//
//    /*---------------------------------------------------------------------------------*/
//
//    var rootNode  = this._node     = new ControlKit.Node(ControlKit.NodeType.DIV),
//        headNode  = this._headNode = new ControlKit.Node(ControlKit.NodeType.DIV),
//        menuNode  =                  new ControlKit.Node(ControlKit.NodeType.DIV),
//        lablWrap  =                  new ControlKit.Node(ControlKit.NodeType.DIV),
//        lablNode  =                  new ControlKit.Node(ControlKit.NodeType.SPAN),
//        wrapNode  = this._wrapNode = new ControlKit.Node(ControlKit.NodeType.DIV),
//        listNode  = this._listNode = new ControlKit.Node(ControlKit.NodeType.LIST);
//
//        rootNode.setStyleClass(ControlKit.CSS.Panel);
//        headNode.setStyleClass(ControlKit.CSS.Head);
//        menuNode.setStyleClass(ControlKit.CSS.Menu);
//        lablWrap.setStyleClass(ControlKit.CSS.Wrap);
//        lablNode.setStyleClass(ControlKit.CSS.Label);
//        wrapNode.setStyleClass(ControlKit.CSS.Wrap);
//        listNode.setStyleClass(ControlKit.CSS.GroupList);
//
//        rootNode.setWidth(width);
//        lablNode.setProperty('innerHTML',label);
//
//        headNode.addChild(menuNode);
//        lablWrap.addChild(lablNode);
//        headNode.addChild(lablWrap);
//        wrapNode.addChild(listNode);
//        rootNode.addChild(headNode);
//        rootNode.addChild(wrapNode);
//
//        controlKit.getNode().addChild(rootNode);
//
//    /*---------------------------------------------------------------------------------*/
//
//    if(!dock)
//    {
//
//        var menuHide  = this._menuHide = new ControlKit.Node(ControlKit.NodeType.INPUT_BUTTON);
//            menuHide.setStyleClass( ControlKit.CSS.MenuBtnHide);
//            menuHide.addEventListener( ControlKit.NodeEventType.MOUSE_DOWN, this._onMenuHideMouseDown.bind(this));
//
//        menuNode.addChild(menuHide);
//
//        if(this._parent.panelsAreClosable())
//        {
//            var menuClose = new ControlKit.Node(ControlKit.NodeType.INPUT_BUTTON);
//            menuClose.setStyleClass(ControlKit.CSS.MenuBtnClose);
//            menuClose.addEventListener(ControlKit.NodeEventType.MOUSE_DOWN, this.disable.bind(this));
//
//            menuNode.addChild(menuClose);
//        }
//
//
//        if(this.hasMaxHeight()){this._addScrollWrap();}
//
//        if(!isFixed)
//        {
//            if(position)
//            {
//                if(align == ControlKit.LayoutMode.LEFT ||
//                   align == ControlKit.LayoutMode.TOP  ||
//                   align == ControlKit.LayoutMode.BOTTOM)
//                {
//                    rootNode.setPositionGlobal(position[0],position[1]);
//                }
//                else
//                {
//                    rootNode.setPositionGlobal(window.innerWidth - width - position[0],position[1]);
//                    this._position = rootNode.getPosition();
//                }
//            }
//            else this._position = rootNode.getPosition();
//
//            this._mouseOffset  = [0,0];
//
//            rootNode.setStyleProperty('position','absolute');
//            headNode.addEventListener(ControlKit.NodeEventType.MOUSE_DOWN,this._onHeadDragStart.bind(this));
//        }
//        else
//        {
//            if(position)
//            {
//                var positionX = position[0],
//                    positionY = position[1];
//
//                if(positionY != 0)rootNode.setPositionY(positionY);
//                if(positionX != 0)if(align==ControlKit.LayoutMode.RIGHT)rootNode.getElement().marginRight = positionX;
//                                  else rootNode.setPositionX(positionX);
//            }
//
//            rootNode.setStyleProperty('float',align);
//        }
//    }
//    else
//    {
//        var dockAlignment = dock.align;
//
//        if(dockAlignment == ControlKit.LayoutMode.LEFT ||
//           dockAlignment == ControlKit.LayoutMode.RIGHT)
//        {
//            align = dockAlignment;
//            this._height = window.innerHeight;
//        }
//
//        if(dockAlignment == ControlKit.LayoutMode.TOP ||
//           dockAlignment == ControlKit.LayoutMode.BOTTOM)
//        {
//
//        }
//
//        /*
//        if(dock.resizable)
//        {
//            var sizeHandle = new ControlKit.Node(ControlKit.NodeType.DIV);
//                sizeHandle.setStyleClass(ControlKit.CSS.SizeHandle);
//                rootNode.addChild(sizeHandle);
//        }
//        */
//
//        rootNode.setStyleProperty('float',align);
//
//    }
//
//    if(this._parent.historyIsEnabled())
//    {
//        var menuUndo = this._menuUndo = new ControlKit.Node(ControlKit.NodeType.INPUT_BUTTON);
//            menuUndo.setStyleClass(ControlKit.CSS.MenuBtnUndo);
//            menuUndo.setStyleProperty('display','none');
//            menuUndo.setProperty('value',ControlKit.History.getInstance().getNumStates());
//            menuNode.addChildAt(menuUndo,0);
//
//            menuUndo.addEventListener(ControlKit.NodeEventType.MOUSE_DOWN, this._onMenuUndoTrigger.bind(this));
//            headNode.addEventListener(ControlKit.NodeEventType.MOUSE_OVER, this._onHeadMouseOver.bind(this));
//            headNode.addEventListener(ControlKit.NodeEventType.MOUSE_OUT,  this._onHeadMouseOut.bind(this))
//    }
//
//    /*---------------------------------------------------------------------------------*/
//
//    if(opacity != 1.0 && opacity != 0.0){rootNode.setStyleProperty('opacity',opacity);}
//
//    /*---------------------------------------------------------------------------------*/
//
//    this._parent.addEventListener(ControlKit.EventType.UPDATE_MENU,      this, 'onUpdateMenu');
//    window.addEventListener(ControlKit.DocumentEventType.WINDOW_RESIZE,this._onWindowResize.bind(this));
//};
//
//ControlKit.Panel.prototype = Object.create(ControlKit.EventDispatcher.prototype);
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype.addGroup  = function(params)
//{
//    var group = new ControlKit.Group(this,params);
//    this._groups.push(group);
//    if(this.isDocked())this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_SIZE_CHANGE));
//    return group;
//};
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype._onMenuHideMouseDown = function()
//{
//    this._isDisabled = !this._isDisabled;
//    this._updateAppearance();
//};
//
//ControlKit.Panel.prototype._updateAppearance = function()
//{
//    var rootNode = this._node,
//        headNode = this._headNode,
//        menuHide = this._menuHide;
//
//    if(this._isDisabled)
//    {
//        headNode.getStyle().borderBottom = 'none';
//
//        rootNode.setHeight(headNode.getHeight());
//        menuHide.setStyleClass(ControlKit.CSS.MenuBtnShow);
//
//        this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_HIDE,null));
//    }
//    else
//    {
//        rootNode.setHeight(headNode.getHeight() +  this._wrapNode.getHeight());
//        rootNode.deleteStyleProperty('height');
//        menuHide.setStyleClass(ControlKit.CSS.MenuBtnHide);
//        headNode.setStyleClass(ControlKit.CSS.Head);
//
//        this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_SHOW,null));
//    }
//};
//
//ControlKit.Panel.prototype._onHeadMouseOver   = function(){this._menuUndo.setStyleProperty('display','inline')};
//ControlKit.Panel.prototype._onHeadMouseOut    = function(){this._menuUndo.setStyleProperty('display','none')};
//ControlKit.Panel.prototype.onUpdateMenu       = function(){this._menuUndo.setProperty('value',ControlKit.History.getInstance().getNumStates());};
//
//ControlKit.Panel.prototype._onMenuUndoTrigger = function(){ControlKit.History.getInstance().popState();};
//
///*---------------------------------------------------------------------------------*
//* Panel dragging
//*----------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype._onHeadDragStart = function()
//{
//    var parentNode = this._parent.getNode(),
//        node       = this._node;
//
//    var nodePos   = node.getPositionGlobal(),
//        mousePos  = ControlKit.Mouse.getInstance().getPosition(),
//        offsetPos = this._mouseOffset;
//
//        offsetPos[0] = mousePos[0] - nodePos[0];
//        offsetPos[1] = mousePos[1] - nodePos[1];
//
//    var eventMouseMove = ControlKit.DocumentEventType.MOUSE_MOVE,
//        eventMouseUp   = ControlKit.DocumentEventType.MOUSE_UP;
//
//    var self = this;
//
//    var onDrag    = function()
//                    {
//                        self._updatePosition();
//                    },
//
//        onDragEnd = function()
//                    {
//                        document.removeEventListener(eventMouseMove, onDrag,    false);
//                        document.removeEventListener(eventMouseUp,   onDragEnd, false);
//                        self.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_MOVE_END,null));
//                    };
//
//    parentNode.removeChild(node);
//    parentNode.addChild(   node);
//
//    document.addEventListener(eventMouseMove, onDrag,    false);
//    document.addEventListener(eventMouseUp,   onDragEnd, false);
//
//    this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_MOVE_BEGIN,null));
//};
//
//ControlKit.Panel.prototype._updatePosition = function()
//{
//    var mousePos  = ControlKit.Mouse.getInstance().getPosition(),
//        offsetPos = this._mouseOffset;
//
//    var position = this._position;
//        position[0] = mousePos[0] - offsetPos[0];
//        position[1] = mousePos[1] - offsetPos[1];
//
//    this._constrainHeight();
//    this._constrainPosition();
//
//    this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_MOVE,null));
//};
//
//ControlKit.Panel.prototype._onWindowResize = function()
//{
//    if(this.isDocked())
//    {
//        var dock = this._dock;
//
//        if(dock.align == ControlKit.LayoutMode.RIGHT ||
//           dock.align == ControlKit.LayoutMode.LEFT )
//        {
//            var windowHeight = window.innerHeight,
//                listHeight   = this._listNode.getHeight(),
//                headHeight   = this._headNode.getHeight();
//
//            this._height = windowHeight;
//
//            if((windowHeight - headHeight) > listHeight)this._scrollBar.disable();
//            else this._scrollBar.enable();
//
//            this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_SIZE_CHANGE));
//        }
//    }
//    else
//    {
//        if(!this.isFixed())this._constrainPosition();
//    }
//
//    this._constrainHeight();
//
//    this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.WINDOW_RESIZE));
//};
//
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype._constrainPosition = function()
//{
//    var node = this._node;
//
//    var maxX = window.innerWidth  - node.getWidth(),
//        maxY = window.innerHeight - node.getHeight();
//
//    var position    = this._position;
//        position[0] = Math.max(0,Math.min(position[0],maxX));
//        position[1] = Math.max(0,Math.min(position[1],maxY));
//
//    node.setPositionGlobal(position[0],position[1]);
//};
//
//ControlKit.Panel.prototype._constrainHeight = function()
//{
//    if(!this._vConstrain)return;
//
//    var hasMaxHeight  = this.hasMaxHeight(),
//        hasScrollWrap = this.hasScrollWrap();
//
//    var headNode      = this._headNode,
//        wrapNode      = this._wrapNode;
//
//    var scrollBar     = this._scrollBar;
//
//    var panelTop      = this.isDocked() ? 0 :
//                        this.isFixed()  ? 0 :
//                        this._position[1];
//
//    var panelHeight   = hasMaxHeight  ? this.getMaxHeight() :
//                        hasScrollWrap ? scrollBar.getTargetNode().getHeight() :
//                        wrapNode.getHeight();
//
//    var panelBottom   = panelTop + panelHeight;
//    var headHeight    = headNode.getHeight();
//
//    var windowHeight  = window.innerHeight,
//        heightDiff    = windowHeight - panelBottom - headHeight,
//        heightSum;
//
//    if(heightDiff < 0.0)
//    {
//        heightSum = panelHeight + heightDiff;
//
//        if(!hasScrollWrap)
//        {
//            this._addScrollWrap(heightSum);
//            this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_SCROLL_WRAP_ADDED, null));
//            return;
//        }
//
//        scrollBar.setWrapHeight(heightSum);
//        wrapNode.setHeight(heightSum);
//    }
//    else
//    {
//        if(!hasMaxHeight && hasScrollWrap)
//        {
//            scrollBar.removeFromParent();
//            wrapNode.addChild(this._listNode);
//            wrapNode.deleteStyleProperty('height');
//
//            this._scrollBar = null;
//
//            this.dispatchEvent(new ControlKit.Event(this,ControlKit.EventType.PANEL_SCROLL_WRAP_REMOVED, null));
//        }
//    }
//};
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype.onGroupListSizeChange = function()
//{
//    if(this.hasScrollWrap())this._updateScrollWrap();
//    this._constrainHeight();
//};
//
//ControlKit.Panel.prototype._updateScrollWrap = function()
//{
//    var wrapNode   = this._wrapNode,
//        scrollBar  = this._scrollBar,
//        height     = this.hasMaxHeight() ?
//            this.getMaxHeight() : 100,
//        listHeight = this._listNode.getHeight();
//
//    wrapNode.setHeight(listHeight < height ? listHeight : height);
//
//    scrollBar.update();
//
//    if (!scrollBar.isValid())
//    {
//        scrollBar.disable();
//        wrapNode.setHeight(wrapNode.getChildAt(1).getHeight());
//    }
//    else
//    {
//        scrollBar.enable();
//        wrapNode.setHeight(height);
//    }
//};
//
//ControlKit.Panel.prototype._addScrollWrap = function()
//{
//    var wrapNode = this._wrapNode,
//        listNode = this._listNode,
//        height   = arguments.length == 0 ?
//                   this.getMaxHeight() :
//                   arguments[0];
//
//    this._scrollBar = new ControlKit.ScrollBar(wrapNode,listNode,height);
//    if(this.isEnabled())wrapNode.setHeight(height);
//};
//
//ControlKit.Panel.prototype.hasScrollWrap = function()
//{
//    return this._scrollBar != null;
//};
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype.preventSelectDrag = function()
//{
//    if(!this.hasScrollWrap())return;
//    this._wrapNode.getElement().scrollTop = 0;
//};
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype.enable  = function()
//{
//    this._node.setStyleProperty('display','block');
//    this._isDisabled = false;
//    this._updateAppearance();
//};
//
//ControlKit.Panel.prototype.disable = function()
//{
//    this._node.setStyleProperty('display','none');
//    this._isDisabled = true;
//    this._updateAppearance();
//};
//
//ControlKit.Panel.prototype.isEnabled  = function(){return !this._isDisabled;};
//ControlKit.Panel.prototype.isDisabled = function(){return this._isDisabled;};
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype.hasMaxHeight  = function(){return this._height != null;};
//ControlKit.Panel.prototype.getMaxHeight  = function(){return this._height;};
//
//ControlKit.Panel.prototype.isDocked      = function(){return this._dock;};
//ControlKit.Panel.prototype.isFixed       = function(){return this._fixed;};
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype.getGroups     = function(){return this._groups;};
//ControlKit.Panel.prototype.getNode       = function(){return this._node;};
//ControlKit.Panel.prototype.getList       = function(){return this._listNode;};
//
///*---------------------------------------------------------------------------------*/
//
//ControlKit.Panel.prototype.getWidth      = function(){return this._width;};
//ControlKit.Panel.prototype.getPosition   = function(){return this._position;};