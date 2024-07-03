


class MainDisplay {
    constructor(name){
        this.name = name
        this.page = 1; // Current page for infinite scroll
        this.isLoading = false; // Flag to prevent multiple fetches
        this.imagesPerPage = 12; // Number of images to fetch per page
        this.totalImagesLoaded = 0; // Track total images loaded
        this.idData = []
        this.displayImages()
        this.eventListeners()

    }

    eventListeners() {

        document.addEventListener('DOMContentLoaded', this.lazyLoad.bind(this))
        document.addEventListener('scroll', this.lazyLoad.bind(this));
        window.addEventListener('resize', this.lazyLoad.bind(this))
        window.addEventListener('orientationchange', this.lazyLoad.bind(this))
        window.addEventListener('scroll', this.infiniteScroll.bind(this)) // Add scroll listener for infinite scroll
    }

    async fetchAPIData() {

        const apiKey = 'SGEpERIy2TJj2F0CaDOqbhdIlGMzwTjA5MuuJ9EJ6HujhtTBL52zeBiL';
        const apiUrl = `https://api.pexels.com/v1/curated?page=${this.page}&per_page=${this.imagesPerPage}`;

        try {

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': apiKey
            }
        });

        const data = await response.json();

        return data

        } catch(error) {
            console.error('Error fetching data from Pexels:', error)
       }
    }

    async displayImages() {
        // code for infinite scroll
        if(this.isLoading) { return };
        this.isLoading = true;
        this.showSpinner(); // show spinner before loading new images

        // fetch results object
        const results = await this.fetchAPIData();

        // canceling the infinite scroll if i get no results
        if(!results) {
            this.isLoading = false;
            this.hideSpinner(); // Hide spinner if fetching fails
            return
        }

        const photos = results.photos;

        // Filter photos to get only those with unique IDs
        const uniquePhotos = photos.filter((photo) => {

            if(!this.idData.includes(photo.id)) {

                this.idData.push(photo.id) // Add the new unique ID to the array
                
                return true // Keep this photo in the filtered results
            }
            return false // Exclude this photo as it is a duplicate
        })

        // storing photos id for the filter above
        photos.forEach((photo) => {
            this.idData.push(photo.id)
        })

        // display unique photos
        uniquePhotos.forEach(photo => {
            const src = photo.src.large2x;
            const photographer = photo.photographer
            this.photoElements(src, photographer)
        })

        this.page++; // go to next page

        this.totalImagesLoaded += photos.length; // Update total images loaded

        this.isLoading = false; // deactivating isLoading

        this.showSpinner(); // hide spinner after images are loaded

    }

    photoElements(imageSrc, photographer) {

        const photosContainer = document.querySelector('.images-container')

        const figure = document.createElement('figure')

        const p = document.createElement('p')
        p.classList.add('artist')

        const pText = document.createTextNode(photographer)

        const img = document.createElement('img')
        img.setAttribute('data-src', imageSrc)
        img.width = '100%';
        img.height = '100%';
        img.classList.add('lazy');
        img.classList.add('loaded')


        photosContainer.appendChild(figure)
        figure.appendChild(img)
        figure.appendChild(p)
        p.appendChild(pText)
        this.lazyLoad()
    }

    lazyLoad() {

        // this code is for the fallback lazy load
        let lazyImages = document.querySelectorAll('.lazy')

        let active = false; // This boolean flag helps to surppress the lazyLoad function to avoid running it too frequently.

        lazyImages.forEach(image => {
            if(image.classList.contains('lazy')){
                image.classList.add('placeholder')
            }

            image.style.backgroundColor = '#00000081';
        })

        // ------------------------------------------------

        // checking to see if the browser has IntersectionObserver
        if('IntersectionObserver' in window){

            const options = {

                root: null, // Specifies that the root element to use for intersection is the browser viewport. If you wanted to use another element as the root, you would reference that element here.
            
                rootMargin: '0px', // Adds a margin around the root element. In this case, it’s set to 0px, meaning no extra margin.
            
                threshold: 0.1, // This specifies the percentage of the image that must be visible for the observer callback to be executed. Here, 0.1 means the observer will trigger when 10% of the image is visible in the viewport.
            }
            
            // Creates an IntersectionObserver instance. witha a call back function
            const observer = new IntersectionObserver((entries, observer) => {

                // The callback function is called when the observed elements intersect with the root element.
                entries.forEach(entry => {

                    // Checks if the observed element (entry.target) is intersecting the viewport.
                    if(entry.isIntersecting) {

                        // it select the object that is being observerd and put it into a variable
                        const image = entry.target;

                        // // If the element is intersecting, this line sets the src attribute of the image to the URL stored in data-src, triggering the image to load.
                        image.src = image.getAttribute('data-src');

                        // Removes the lazy class from the image, marking it as loaded and no longer lazy.
                        image.classList.remove('lazy');

                        if(!image.classList.contains('lazy')){
                            image.classList.remove('placeholder')
                        }

                        // Stops observing this image to prevent unnecessary checks in the future.
                        observer.unobserve(image);
                    }
                })
            }, options);

            // Selects all elements with the lazy class and starts observing them with the IntersectionObserver.
            document.querySelectorAll('.lazy').forEach(image => {
                observer.observe(image)
            })

    } else { 

        // FALLBACK Lazy Load

        if(active === false){
            // This 'if' Ensures that the function is not called again until the current execution is complete. This surpress the function to improve performance.
            active = true;
    
           // Delays the execution of the function to give the browser time to settle between events like scrolls or resizes. This further reduces the load on the browser.
           setTimeout(() => {
    
            // Iterates over all lazy images.
            lazyImages.forEach(lazyImage => {
    
                // Checks if the image is within the viewport and visible. getBoundingClientRect() provides the position of the image relative to the viewport.
                if((lazyImage.getBoundingClientRect().top <= window.innerHeight && lazyImage.getBoundingClientRect().bottom >= 0) && getComputedStyle(lazyImage).display !== 'none'){
                    
                    // Loads the image by setting its src attribute to the URL in data-src.
                    lazyImage.src = lazyImage.getAttribute('data-src');
    
                    // Marks the image as loaded.
                    lazyImage.classList.remove('lazy');
    
                    // Removes the loaded image from the lazyImages array, converting the NodeList to an array first for filtering.
                    lazyImages = Array.from(lazyImages).filter(image => image !== lazyImage)
    
                    // Checks if there are no more lazy images left to load. If true, it removes the event listeners.
                    if(lazyImages.length === 0){
    
                        document.removeEventListener('scroll', this.lazyLoad.bind(this));
                        window.removeEventListener('resize', this.lazyLoad.bind(this));
                        window.removeEventListener('orientationchange', this.lazyLoad.bind(this));
                    }
                }
            })
            active = false;
    
        }, 200)
      }

    }
  }

   /* code to go to next page every time i go pass the window view port
     if((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        this.displayImages(); // Fetch more images when nearing the bottom
    } */

  // The configuration for this infiniteScroll is to load the next page every time the user see the last images, and not necessary when the user scroll pass the bottom of the window view.
  infiniteScroll() {
    // select all images in the container
    const allImages = document.querySelectorAll('.images-container img'); 

    // selecting the 9th image
    const lastImage = allImages[allImages.length - 3];

    // check if the 9th image is in view
    if(lastImage && this.isElementInView(lastImage)) {

        this.displayImages(); // fetch more images when the 9th image is in view
    }
   }

   // getting the rect of the 9th element
    isElementInView(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // spinner functions
    showSpinner() {
        const spinner = document.getElementById('spin');
        spinner.classList.add('spinner')
    }

    hideSpinner() {
        const spinner = document.getElementById('spin');
        spinner.classList.remove('spinner')
    }
}



// Class for search page
class SearchDisplay extends MainDisplay {

    // super keyword is here so i can use the constructor in this class, otherwise i wouldn't be able to
    constructor(name){
        super(name)
        this.page = 1 // start page
        this.isLoading = false;
        this.imagesPerPage = 12;
        document.querySelector('.search-form').addEventListener('submit', this.displayImages.bind(this))
    };

    async fetchAPISearch(term) {

        try {
            const apiKey = 'SGEpERIy2TJj2F0CaDOqbhdIlGMzwTjA5MuuJ9EJ6HujhtTBL52zeBiL';

            const apiUrl = `https://api.pexels.com/v1/search?query=${term}&page=${this.page}&per_page=${this.imagesPerPage}`;

            const response = await fetch(apiUrl, {
            headers: {
                'Authorization': apiKey
            }
            });

            if(!response.ok){
                throw new Error('falied to fetch images')
            }
            
            const data = await response.json();
            return data

        } catch(error) {
            console.error('Error', error);

        }
    }

    async displayImages() {

        if(this.isLoading) { return };
        this.isLoading = true;
        this.showSpinner(); // show spinner before loading new images

       // getting query from the search bar
       const queryString = window.location.search;

       // separating what i got in the querystring
       const urlParams = new URLSearchParams(queryString);

       // get only the ter
       const term = urlParams.get('search-term');

       this.fetchAPISearch(term);

       // check if there are any term in the search bar 
       if(term !== '' && term !== null && term !== undefined){

        // if there are terms i want to run this code bellow

        // getting the object from the API
        const results = await this.fetchAPISearch(term);

        if(!results) {
            this.isLoading = false;
            this.hideSpinner()
            return;
        }

        // getting the photos array from the object
        const photos = results.photos;

        // selecting the home link in the page, and adding a class to it to make it appear on the page
        const homeLink = document.querySelector('#home');
        homeLink.classList.add('home-link');
        
        // checks to see if there is no results
        if(photos.length === 0){

            // if no results is found i want to show this alert
            this.showAlert('No results found')

        } else {

            // if there are results i want to display them using forEach in the photos array
            photos.forEach((photo) => {
            const src = photo.src.large2x
            this.photoElements(src)
        })
        };

        this.page++;
        this.isLoading = false;
        this.hideSpinner();

       } else {

        // if the user does not specify a term these photos are added to the page
        const results = await this.fetchAPIData();

        const photos = results.photos;

        photos.forEach(photo => {
            const src = photo.src.large2x
            this.photoElements(src)
        })

        // getting the home link, cleaning its innerText and removing its class to give the user the impression of being in the main page
        const homeLink = document.querySelector('#home');
        homeLink.innerText = '';
        homeLink.classList.remove('home-link');

        // calling the alert
        this.showAlert('No Search Term!');

       };

       this.page++ // go to next page

    };

    async showAlert(message){

        const divAlert = document.getElementById('alert')
    
        const pEl = document.createElement('p')

        const text = document.createTextNode(message)
    
        pEl.appendChild(text)
    
        divAlert.appendChild(pEl)
    
        divAlert.classList.add('alert')
    
        setTimeout(() => {

            divAlert.classList.remove('alert')
            text.remove()

        }, 2000)
      }

}


class PageEvents {
    constructor() {
        this.checkForImageContainer()
        window.document.addEventListener('click', this.displayContainer.bind(this))
    }

    displayContainer(e) {

        // this check make sure that im clicking on an image
        if(e.target.classList.contains('loaded')) {

            const layerClassName = 'layer'

            // selecting figure parent
            const figure = e.target.parentElement;

            // select photograper name stored in an dynamic created p when i created the images containers
            const photographer = figure.children[1].innerText;

            // selecting the src of the clicked image
            const src = e.target.src

            // passing the src, layer class name, and photograper name data for the imageContainer so i can use them there
            this.imageContainer(src, layerClassName, photographer)

            // initializing the check for container right on the click. otherwise i wouldnt be able to 
            this.checkForImageContainer()

            // taking out the scroll from the page
            const body = document.querySelector('body');
            body.classList.add('no-scroll')
        }
    }

    // creating the container that will display the image selected
    imageContainer(src, layerClass, photographer) {
        const layer = document.querySelector('#layer');
        layer.classList.add(layerClass)

        const mainContainer = document.createElement('div')
        mainContainer.classList.add('main-container')

        const btnContainer = document.createElement('button')
        btnContainer.classList.add('btn-container')

        const btnX = document.createElement('i')
        btnX.classList.add('ri-close-large-line')
        btnX.classList.add('btn-x')

        const figureContainer = document.createElement('div')
        figureContainer.classList.add('figure-container')

        const img = document.createElement('img')
        img.classList.add('image-in-view')
        img.src = src

        const artist = document.createElement('p')
        artist.classList.add('photographer')

        const name = document.createTextNode(`Photo by : ${photographer}`)

        // appending
        artist.appendChild(name)
        figureContainer.appendChild(img)
        btnContainer.appendChild(btnX)
        mainContainer.appendChild(btnContainer)
        mainContainer.appendChild(figureContainer)
        mainContainer.appendChild(artist)
        layer.appendChild(mainContainer)
    }

    // this check makes sure that i have the layer on before i add an event listener to the btn-x element, this element only exist when the layer is on
    checkForImageContainer() {
        const layerClass = document.querySelector('#layer').className;

        if(layerClass === 'layer') {

            document.querySelector('.btn-x').addEventListener('click', this.closeImageContainer.bind(this))

        } else {

            return
        }
    }

    closeImageContainer() {

        const layer = document.querySelector('#layer');

        const body = document.querySelector('body');

        while(layer.firstChild) {
            layer.removeChild(layer.firstChild)
        }

        layer.classList.remove('layer')
        layer.classList.remove('on')
        body.classList.remove('no-scroll')
    
    }
}



// router
function init(){
    switch(window.location.pathname){
        case '/JavaScript/Java-Projects/Promise-Image-Gallery-with-Lazy-Loading/index.html':
            new MainDisplay('main')
            new PageEvents()
        break;
        case '/JavaScript/Java-Projects/Promise-Image-Gallery-with-Lazy-Loading/search.html':
            new SearchDisplay('Search')
            new PageEvents()
        break;
    }
}

document.addEventListener('DOMContentLoaded', init)