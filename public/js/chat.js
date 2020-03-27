// server (emit) -> client (receive) --acknowledgement --> server
// client (emit) -> server (receive) --acknowledgement --> client

const chatMessageSent = document.querySelector('#chat-message-sent');
const socket = io()

// elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})
const autoscroll = () => {
    // New Message element
    const $newMessage = $messages.lastElementChild

    // Height of the last message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight
    
    // Height of messages container
    const ContainerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight



    if (ContainerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message) => {
    const html = Mustache.render($messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll();
});

socket.on('locationMessage', (message) => {
    const html = Mustache.render($locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //disable form
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        //enable form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            chatMessageSent.textContent = 'Error';
            alert('Error Sending')
            return console.log(error)
            
        }
        console.log('The message was delivered!')
        chatMessageSent.textContent = message;
    })
    
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by browser...')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition( (position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
            }, () => {
                console.log('Location shared...')
                $sendLocationButton.removeAttribute('disabled')
        })
    })
})


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }

})