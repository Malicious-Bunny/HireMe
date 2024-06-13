function showContent(section) {
    // Hide all content items
    const contentItems = document.querySelectorAll('.content-item');
    contentItems.forEach(item => item.classList.remove('active'));

    // Show the selected content item
    const selectedContent = document.getElementById(section);
    selectedContent.classList.add('active');
}

function handleAgree(section) {
    alert(`You agreed to the ${section.replace(/-/g, ' ')} section.`);
}

function handleDisagree(section) {
    alert(`You disagreed with the ${section.replace(/-/g, ' ')} section.`);
}

// Initially display the first menu item content
document.addEventListener('DOMContentLoaded', () => {
    showContent('terms');
});
