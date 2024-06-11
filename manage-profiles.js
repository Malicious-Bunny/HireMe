document.addEventListener('DOMContentLoaded', function() {
    // Add skill event listener
    document.getElementById('add-skill').addEventListener('click', function() {
        const skillInput = document.getElementById('new-skill');
        const skill = skillInput.value.trim();
        if (skill) {
            const skillItem = document.createElement('div');
            skillItem.className = 'form__selected-skill';
            skillItem.textContent = skill;

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-skill';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.addEventListener('click', function() {
                skillItem.remove();
            });

            skillItem.appendChild(removeButton);
            document.getElementById('skills-list').appendChild(skillItem);
            skillInput.value = '';
        }
    });

    // Add social link event listener
    document.getElementById('add-social-link').addEventListener('click', function() {
        const linkInput = document.getElementById('new-social-link');
        const link = linkInput.value.trim();
        if (link) {
            const linkItem = document.createElement('div');
            linkItem.className = 'form__social-link';
            linkItem.textContent = link;

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-link';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.addEventListener('click', function() {
                linkItem.remove();
            });

            linkItem.appendChild(removeButton);
            document.getElementById('social-links-list').appendChild(linkItem);
            linkInput.value = '';
        }
    });

    // Save button event listener
    document.querySelector('.form__button--save').addEventListener('click', async function() {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        data.skills = Array.from(document.querySelectorAll('.form__selected-skill')).map(skill => skill.textContent);
        data.socialLinks = Array.from(document.querySelectorAll('.form__social-link')).map(link => link.textContent);

        try {
            const response = await fetch('/save-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Error saving profile');
        }
    });

    // Delete button event listener
    document.querySelector('.form__button--delete').addEventListener('click', function() {
        document.getElementById('delete-popup').style.display = 'block';
    });

    // Cancel delete popup button event listener
    document.querySelector('.popup__button--cancel').addEventListener('click', function() {
        document.getElementById('delete-popup').style.display = 'none';
    });

    // Confirm delete button event listener
    document.querySelector('.popup__button').addEventListener('click', async function() {
        const password = document.querySelector('.popup__input').value;

        try {
            const response = await fetch('/delete-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const result = await response.json();
            if (response.ok) {
                window.location.href = result.redirectUrl;
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error deleting profile:', error);
            alert('Error deleting profile');
        }
    });
});
