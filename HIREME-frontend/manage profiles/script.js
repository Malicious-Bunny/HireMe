document.querySelector('.profile-form').addEventListener('submit', function(event) {
    event.preventDefault();
    // Handle form submission logic
    alert('Profile saved!');
});

document.querySelector('.delete-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to delete your profile?')) {
        // Handle profile deletion logic
        alert('Profile deleted!');
    }
});
