document.getElementById('search').addEventListener('input', filterProfiles);
document.getElementById('skills').addEventListener('change', filterProfiles);
document.getElementById('experience').addEventListener('change', filterProfiles);
document.getElementById('location').addEventListener('change', filterProfiles);

function filterProfiles() {
    const search = document.getElementById('search').value.toLowerCase();
    const skill = document.getElementById('skills').value.toLowerCase();
    const experience = document.getElementById('experience').value.toLowerCase();
    const location = document.getElementById('location').value.toLowerCase();

    document.querySelectorAll('.profile-card').forEach(card => {
        const name = card.querySelector('.profile-card__name').textContent.toLowerCase();
        const cardSkills = card.querySelector('.profile-card__details:nth-child(2)').textContent.toLowerCase();
        const cardExperience = card.querySelector('.profile-card__details:nth-child(3)').textContent.toLowerCase();
        const cardLocation = card.querySelector('.profile-card__details:nth-child(4)').textContent.toLowerCase();

        const matchesSearch = search === "" || name.includes(search);
        const matchesSkill = skill === "" || cardSkills.includes(skill);
        const matchesExperience = experience === "" || cardExperience.includes(experience);
        const matchesLocation = location === "" || cardLocation.includes(location);

        if (matchesSearch && matchesSkill && matchesExperience && matchesLocation) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}
