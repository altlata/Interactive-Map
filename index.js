// 初始化地图，使用自定义坐标系
const map = L.map('map', {
    crs: L.CRS.Simple, // 使用简单坐标系
    minZoom: -3,
    maxZoom: 4,
    zoomControl: false, // 隐藏默认缩放控件
    maxBounds: [[0, 0], [6809, 6509]], // 设置边界限制
    maxBoundsViscosity: 1.0 // 完全限制在边界内
});

// 定义图片的边界（根据您提供的尺寸6509x6809）
// 在简单坐标系中，我们可以将图片的左上角设为[0,0]，右下角设为[6809,6509]
const bounds = [[0, 0], [6809, 6509]];

// 加载本地JPG图片作为地图
const imageUrl = 'EldenRingMap.jpg'; // 确保这个JPG文件存在
const imageOverlay = L.imageOverlay(imageUrl, bounds).addTo(map);

// 设置地图视图以显示整个图片
map.fitBounds(bounds);

// 隐藏加载提示
document.querySelector('.map-loading').style.display = 'none';

// 存储标记和当前选择的颜色
let markers = [];
let selectedColor = 'red';
let isAddingMarker = false;

// 颜色选择
document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
        // 移除之前选中的颜色
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // 设置当前选中的颜色
        this.classList.add('selected');
        selectedColor = this.getAttribute('data-color');
    });
});

// 显示鼠标位置坐标
map.on('mousemove', function(e) {
    const coords = e.latlng;
    document.getElementById('coordinates').textContent = 
        `坐标: X:${Math.round(coords.lat)}, Y:${Math.round(coords.lng)}`;
});

// 添加标记功能
map.on('click', function(e) {
    if (!isAddingMarker) {
        return; // 如果未激活添加标记模式，则不添加
    }
    
    // 根据选择的颜色设置标记图标
    let markerColor = selectedColor;
    let markerIcon = L.divIcon({
        className: `custom-marker ${markerColor}`,
        html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.7);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    // 添加标记到地图
    const marker = L.marker(e.latlng, {icon: markerIcon}).addTo(map);
    
    // 为标记添加弹出窗口
    const markerId = markers.length;
    marker.bindPopup(`
        <div style="text-align: center; min-width: 200px;">
            <b>Marker ${markerId + 1}</b><br>
            Coordinates: X${Math.round(e.latlng.lat)}, Y${Math.round(e.latlng.lng)}<br>
            <input type="text" id="marker-note-${markerId}" placeholder="添加备注..." style="margin: 8px 0; padding: 5px; width: 100%;"><br>
            <button class="save-note" data-id="${markerId}" style="background: #5d4037; color: #f0d8b8; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Save</button>
            <button class="remove-marker" data-id="${markerId}" style="background: #c62828; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer;">Remove</button>
        </div>
    `);
    
    // 存储标记信息
    markers.push({
        id: markerId,
        latlng: e.latlng,
        color: markerColor,
        marker: marker,
        note: ''
    });
    
    // 更新标记列表和计数器
    updateMarkerList();
    updateMarkerCounter();
    
    // 为弹出窗口中的删除按钮添加事件监听
    marker.on('popupopen', function() {
        document.querySelector('.remove-marker').addEventListener('click', function() {
            const markerId = parseInt(this.getAttribute('data-id'));
            removeMarker(markerId);
        });
        
        // 为保存备注按钮添加事件监听
        document.querySelector('.save-note').addEventListener('click', function() {
            const markerId = parseInt(this.getAttribute('data-id'));
            const noteInput = document.getElementById(`marker-note-${markerId}`);
            markers[markerId].note = noteInput.value;
            updateMarkerList();
        });
    });
});

// 更新标记列表
function updateMarkerList() {
    const markerList = document.getElementById('marker-list');
    const searchTerm = document.getElementById('marker-search').value.toLowerCase();
    
    markerList.innerHTML = '';
    
    // 过滤标记
    const filteredMarkers = markers.filter(marker => 
        marker.note.toLowerCase().includes(searchTerm) || 
        `Marker ${marker.id + 1}`.includes(searchTerm)
    );
    
    if (filteredMarkers.length === 0) {
        markerList.innerHTML = '<div style="text-align: center; padding: 20px; color: #8d6e63;">' + 
            (searchTerm ? '未找到匹配的标记' : '暂无标记，点击上方按钮开始添加') + '</div>';
        return;
    }
    
    filteredMarkers.forEach(marker => {
        const markerItem = document.createElement('div');
        markerItem.className = 'marker-item';
        markerItem.innerHTML = `
            <div class="marker-info">
                <div class="marker-color" style="background-color: ${marker.color};"></div>
                <div class="marker-details">
                    <div>Marker ${marker.id + 1} (X:${Math.round(marker.latlng.lat)}, Y:${Math.round(marker.latlng.lng)})</div>
                    ${marker.note ? `<div class="marker-note">${marker.note}</div>` : ''}
                </div>
            </div>
            <button class="remove-marker-btn" data-id="${marker.id}">Remove</button>
        `;
        markerList.appendChild(markerItem);
    });
    
    // 为删除按钮添加事件监听
    document.querySelectorAll('.remove-marker-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const markerId = parseInt(this.getAttribute('data-id'));
            removeMarker(markerId);
        });
    });
}

// 更新标记计数器
function updateMarkerCounter() {
    document.getElementById('marker-count').textContent = markers.length;
}

// 删除标记
function removeMarker(id) {
    // 从地图中移除
    map.removeLayer(markers[id].marker);
    
    // 从数组中移除
    markers.splice(id, 1);
    
    // 重新分配ID
    markers.forEach((marker, index) => {
        marker.id = index;
    });
    
    // 更新标记列表和计数器
    updateMarkerList();
    updateMarkerCounter();
}

// 清除所有标记
document.getElementById('clear-markers-btn').addEventListener('click', function() {
    if (markers.length === 0) return;
    
    if (confirm('确定要清除所有标记吗？此操作不可撤销。')) {
        markers.forEach(marker => {
            map.removeLayer(marker.marker);
        });
        markers = [];
        updateMarkerList();
        updateMarkerCounter();
    }
});

// 自定义缩放控件
document.getElementById('zoom-in').addEventListener('click', function() {
    map.zoomIn();
});

document.getElementById('zoom-out').addEventListener('click', function() {
    map.zoomOut();
});

// 搜索功能
document.getElementById('marker-search').addEventListener('input', function() {
    updateMarkerList();
});

// 初始更新标记列表和计数器
updateMarkerList();
updateMarkerCounter();

// 添加标记按钮功能
document.getElementById('add-marker-btn').addEventListener('click', function() {
    isAddingMarker = !isAddingMarker;
    
    if (isAddingMarker) {
        this.textContent = '取消添加标记';
        this.style.background = 'linear-gradient(to bottom, #c62828, #8e0000)';
    } else {
        this.textContent = 'Add Marker';
        this.style.background = 'linear-gradient(to bottom, #8d6e63, #5d4037)';
    }
});

// 添加键盘快捷键
document.addEventListener('keydown', function(e) {
    // ESC键取消添加标记模式
    if (e.key === 'Escape' && isAddingMarker) {
        isAddingMarker = false;
        document.getElementById('add-marker-btn').textContent = '点击地图添加标记';
        document.getElementById('add-marker-btn').style.background = 'linear-gradient(to bottom, #8d6e63, #5d4037)';
    }
    
    // 数字键1、2、3快速选择标记颜色
    if (e.key === '1') {
        selectedColor = 'red';
        updateColorSelection();
    } else if (e.key === '2') {
        selectedColor = 'green';
        updateColorSelection();
    } else if (e.key === '3') {
        selectedColor = 'blue';
        updateColorSelection();
    }
});

// 更新颜色选择UI
function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-color') === selectedColor) {
            opt.classList.add('selected');
        }
    });
}