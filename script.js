class PageItem {

    x = 0;
    y = 0;
    width = 48;
    height = 64;
    velocity = {
        x: 0,
        y: 0
    }
    iconRatio = 0.6;
    speed = 1;
    trailElements = 20;
    trail = [];
    loaded = false;

    constructor(ctx, url, title, iconURL, pageItems) {
        this.pageItems = pageItems;
        this.ctx = ctx;
        this.url = url;
        this.title = title;

        this.icon = new Image(this.width * this.iconRatio, this.height * this.iconRatio);
        this.icon.onload = () => {
            this.loaded = true;
        }
        this.icon.onerror = () => {
            this.icon.src = fallBackIcon;
        }
        
        this.icon.src = iconURL;

        while (this.x + this.y === 0 || this.colidesWith()) {
            this.x = Math.random() * (window.innerWidth - this.width);
            this.y = Math.random() * (window.innerHeight - this.height);
        }

        const vxsq = Math.random()
        const vysq = 1 - vxsq
        this.velocity.x = Math.sqrt(vxsq) * Math.sign(Math.random() - .5);
        this.velocity.y = Math.sqrt(vysq) * Math.sign(Math.random() - .5);

        const textSize = this.ctx.measureText(this.title);
        if (textSize.width > this.width * .95) {
            this.title = this.title.slice(0, 7) + '...';
        }

        if (!url.startsWith('http')) {
            this.url = 'https://' + url;
        }
    }

    otherItems() {
        return this.pageItems.filter(pi => pi !== this);
    }

    colidesWith() {
        return this.otherItems().find(pi => {
            return (
                this.x < pi.x + pi.width &&
                this.x + this.width > pi.x &&
                this.y < pi.y + pi.height &&
                this.y + this.height > pi.y
            );
        });
    }

    isHovered() {
        const { mouseX, mouseY } = window;
        
        return (
            mouseX >= this.x && 
            mouseX <= this.x + this.width && 
            mouseY >= this.y && 
            mouseY <= this.y + this.height
        );
    }

    visit() {
        const a = document.createElement('a');
        a.href = this.url;
        a.click();
    }

    cursorForce() {
        const { mouseX, mouseY } = window;
        if (mouseX === undefined || mouseY === undefined) return
        const dx = this.x + this.width / 2 - mouseX;
        const dy = this.y + this.height / 2 - mouseY;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d > 200) {
            const newVx = this.velocity.x * .99;
            const newVy = this.velocity.y * .99;
            const newNormalizedVx = Math.sqrt(newVx * newVx + newVy * newVy);
            if (newNormalizedVx < 1) {
                return;
            }
            this.velocity.x = newVx;
            this.velocity.y = newVy;
            return;
        }

        const ndx = dx / d;
        const ndy = dy / d;

        const intensity = (200 - d) / 200;

        this.velocity.x += ndx * intensity;
        this.velocity.y += ndy * intensity;
    }


    update() {
        const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);

        if (magnitude >= 1.5) {
            this.trail.push({ x: this.x, y: this.y });

            if (this.trail.length > this.trailElements) {
                this.trail.shift();
            }
        } else this.trail.shift();
        
        const oldX = Number(String(this.x))
        const oldY = Number(String(this.y))

        this.cursorForce();

        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;

        if (this.x + this.width > window.innerWidth || this.x < 0) {
            this.velocity.x *= -1;
            if (this.x < 0) {
                this.x = 0;
            } else {
                this.x = window.innerWidth - this.width;
            }
        }

        if (this.y + this.height > window.innerHeight || this.y < 0) {
            this.velocity.y *= -1;
            if (this.y < 0) {
                this.y = 0;
            } else {
                this.y = window.innerHeight - this.height;
            }
        }

        const cl = this.colidesWith()
        if (this.colidesWith()) {
            this.x = oldX
            this.y = oldY

            const ch = cl.height
            const cw = cl.width

            const cx = cl.x + cl.width / 2
            const cy = cl.y + cl.height / 2

            const tx = this.x + this.width / 2
            const ty = this.y + this.height / 2

            const dx = tx - cx
            const dy = ty - cy

            const alpha = Math.atan(ch/cw);
            const beta = Math.atan(dy/dx)

            if (
                beta < alpha && beta > -alpha ||
                beta < alpha + Math.PI && beta > - alpha + Math.PI
            ) {
                this.velocity.x *= -1
                cl.velocity.x = this.velocity.x *-1
                this.x += this.velocity.x * this.speed * 2;

            } else {
                this.velocity.y *= -1
                cl.velocity.y = this.velocity.y *-1
                this.y += this.velocity.y * this.speed * 2;
            }
        }
    }

    draw() {
        this.update()
        const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        this.trail.forEach((t, i) => {
            this.ctx.fillStyle = `rgba(200, 200, 200, ${Math.pow((Math.min(.5, i / this.trailElements * magnitude / 20)), 2)})`;
            const size = this.width * (1 - i / this.trailElements) + this.width * .7;
            this.ctx.fillRect(t.x + (this.width - size) / 2, t.y + (this.height - size) / 2, size, size);
        }, this);

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        this.ctx.fillStyle = '0003';
        this.ctx.fillRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        // if icon not broken
        if (this.icon.complete) {
            this.ctx.drawImage(
                this.icon, 
                this.x + this.width * (1 - this.iconRatio) / 2, 
                this.y + this.width * .1, 
                this.width * this.iconRatio, 
                this.width * this.iconRatio
            );
        }
        this.ctx.fillStyle = 'black';
        const textSize = this.ctx.measureText(this.title);
        const gap = (this.width - textSize.width) / 2;
        this.ctx.font = '9px Outfit';
        this.ctx.fillText(this.title, this.x + gap, this.y + this.height - 10);
    }
}

const getFaviconLink = (url) => {
    const base = new URL(url).origin;
    const faviconURL = base + '/favicon.ico';
}

const fallBackIcon = "./favicon.png";

const closeButton = document.querySelector('#close');
const addButton = document.querySelector('#add');
const popup = document.querySelector('#popup');
const pageList = popup.querySelector('ul');
const addForm = popup.querySelector('form');
const [urlInput, titleInput, iconInput] = addForm.querySelectorAll('input[type="text"]');
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const pages = JSON.parse(localStorage.getItem('pages')) || [];
let pageItems = [];

let popupOpen = false;

const openPopup = () => {
  popup.classList.remove('hidden');
  popupOpen = true;
}

const closePopup = () => {
  popup.classList.add('hidden');
  popupOpen = false;
}

addButton.addEventListener('click', openPopup);
closeButton.addEventListener('click', closePopup);

const renderPages = () => {
    pageList.innerHTML = '';
    if (pages.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'You have no pages saved.';
        pageList.appendChild(p);
        return;
    }
    pages.forEach((page, index) => {
        const li = document.createElement('li');

        const img = document.createElement('img');
        img.onerror = () => {
            img.src = fallBackIcon;
        }
        img.src = page.icon;
        img.alt = 'Favicon';
        img.width = 16;
        img.height = 16;
        li.appendChild(img);

        span = document.createElement('span');
        span.textContent = page.title;
        li.appendChild(span);

        i = document.createElement('i');
        i.addEventListener('click', () => {
            pages.splice(index, 1);
            generatePageItems();
            localStorage.setItem('pages', JSON.stringify(pages));
            renderPages();
        });
        li.appendChild(i);

        pageList.appendChild(li);
    });
}

addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!urlInput.value || !titleInput.value) {
        return;
    }
    let icon = iconInput.value;
    if (icon && !icon.startsWith('http')) {
        icon = 'https://' + icon;
    }
    pages.push({
        url: urlInput.value,
        title: titleInput.value,
        icon: icon || getFaviconLink(urlInput.value)
    });
    generatePageItems();
    localStorage.setItem('pages', JSON.stringify(pages));
    renderPages();

});

const generatePageItems = () => {
    pageItems = [];
    pages.forEach(pi => 
        pageItems.push(new PageItem(ctx, pi.url, pi.title, pi.icon, pageItems))
    );
}

const update = () => {
    if (!popupOpen) {
        if (pageItems.some(pi => pi.isHovered()))
            canvas.style.cursor = 'pointer';
        else
            canvas.style.cursor = 'default';
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pageItems.forEach(page => {
        page.draw();
    });
}

const updateCanvasSize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    generatePageItems();
}

const canvasClick = () => {
    pageItems.forEach(page => {
        if (page.isHovered()) {
            page.visit();
        }
    });
}

canvas.addEventListener('click', canvasClick);

updateCanvasSize();
renderPages();
generatePageItems();

setInterval(() => {
   update(); 
}, 1000/120);

window.addEventListener('resize', updateCanvasSize);

document.onmousemove = (e) => {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
}