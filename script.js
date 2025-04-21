document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const uploadContainer = document.getElementById("upload-container")
  const fileUpload = document.getElementById("file-upload")
  const imagePreviewContainer = document.getElementById("image-preview-container")
  const imagePreview = document.getElementById("image-preview")
  const clearImageButton = document.getElementById("clear-image")
  const identifyButton = document.getElementById("identify-button")
  const loadingIndicator = document.getElementById("loading-indicator")
  const resultContainer = document.getElementById("result-container")
  const errorAlert = document.getElementById("error-alert")
  const errorMessage = document.getElementById("error-message")
  const identifyAnotherButton = document.getElementById("identify-another")

  // Result elements
  const scientificNameElement = document.getElementById("scientific-name")
  const commonNameElement = document.getElementById("common-name")
  const familyElement = document.getElementById("family")
  const genusElement = document.getElementById("genus")
  const probabilityElement = document.getElementById("probability")
  const progressValueElement = document.getElementById("progress-value")
  const matchCountElement = document.getElementById("match-count")
  const remainingRequestsElement = document.getElementById("remaining-requests")

  // Care tips elements
  const plantCategoryElement = document.getElementById("plant-category")
  const wateringTipElement = document.getElementById("watering-tip")
  const lightTipElement = document.getElementById("light-tip")
  const temperatureTipElement = document.getElementById("temperature-tip")
  const soilTipElement = document.getElementById("soil-tip")

  // Variables
  let currentImage = null

  // Event listeners
  uploadContainer.addEventListener("dragover", handleDragOver)
  uploadContainer.addEventListener("dragleave", handleDragLeave)
  uploadContainer.addEventListener("drop", handleDrop)
  fileUpload.addEventListener("change", handleFileChange)
  clearImageButton.addEventListener("click", clearImage)
  identifyButton.addEventListener("click", identifyPlant)
  identifyAnotherButton.addEventListener("click", resetIdentification)

  // Functions
  function handleDragOver(e) {
    e.preventDefault()
    uploadContainer.classList.add("dragging")
  }

  function handleDragLeave() {
    uploadContainer.classList.remove("dragging")
  }

  function handleDrop(e) {
    e.preventDefault()
    uploadContainer.classList.remove("dragging")

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      processFile(file)
    }
  }

  function handleFileChange() {
    if (fileUpload.files && fileUpload.files[0]) {
      const file = fileUpload.files[0]
      processFile(file)
    }
  }

  function processFile(file) {
    if (file.type.startsWith("image/")) {
      if (file.type === "image/jpeg" || file.type === "image/png") {
        const reader = new FileReader()
        reader.onload = (e) => {
          currentImage = e.target.result
          imagePreview.src = currentImage
          showImagePreview()
          hideError()
        }
        reader.readAsDataURL(file)
      } else {
        showError("Please upload a JPEG or PNG image")
      }
    } else {
      showError("Please upload an image file")
    }
  }

  function showImagePreview() {
    uploadContainer.classList.add("hidden")
    imagePreviewContainer.classList.remove("hidden")
    identifyButton.classList.remove("hidden")
    loadingIndicator.classList.add("hidden")
    resultContainer.classList.add("hidden")
  }

  function clearImage() {
    currentImage = null
    imagePreview.src = ""
    uploadContainer.classList.remove("hidden")
    imagePreviewContainer.classList.add("hidden")
    hideError()
  }

  function showError(message) {
    errorMessage.textContent = message
    errorAlert.classList.remove("hidden")
  }

  function hideError() {
    errorAlert.classList.add("hidden")
  }

  async function identifyPlant() {
    if (!currentImage) return

    identifyButton.classList.add("hidden")
    loadingIndicator.classList.remove("hidden")
    hideError()

    try {
      const result = await identifyPlantImage(currentImage)
      displayResult(result)
    } catch (err) {
      showError(err.message || "Failed to identify plant")
      identifyButton.classList.remove("hidden")
      loadingIndicator.classList.add("hidden")
    }
  }

  function displayResult(result) {
    loadingIndicator.classList.add("hidden")
    resultContainer.classList.remove("hidden")

    // Display plant information
    scientificNameElement.textContent = result.scientificName

    if (result.commonName) {
      commonNameElement.textContent = `Common name: ${result.commonName}`
      commonNameElement.classList.remove("hidden")
    } else {
      commonNameElement.classList.add("hidden")
    }

    familyElement.textContent = result.family
    genusElement.textContent = result.genus
    probabilityElement.textContent = `${result.probability}%`
    progressValueElement.style.width = `${result.probability}%`
    matchCountElement.textContent = `Found ${result.matchCount} possible matches`
    remainingRequestsElement.textContent = `API requests remaining: ${result.remainingRequests}`

    // Display care tips
    const careTips = getPlantCareTips(result.genus, result.scientificName, result.family)
    plantCategoryElement.textContent = careTips.category
    wateringTipElement.textContent = careTips.water
    lightTipElement.textContent = careTips.light
    temperatureTipElement.textContent = careTips.temperature
    soilTipElement.textContent = careTips.soil
  }

  function resetIdentification() {
    resultContainer.classList.add("hidden")
    identifyButton.classList.remove("hidden")
  }

  async function identifyPlantImage(imageBase64) {
    try {
      // Extract the MIME type and base64 data
      let mimeType = "image/jpeg" // Default MIME type
      let base64Data = imageBase64
  
      // If the string includes the data URL prefix, extract the MIME type and base64 data
      if (imageBase64.includes("base64,")) {
        const parts = imageBase64.split("base64,")
        const prefix = parts[0]
  
        // Extract MIME type from the prefix
        if (prefix.includes("image/")) {
          mimeType = prefix.split(":")[1].split(";")[0].trim()
        }
  
        base64Data = parts[1]
      }
  
      // Ensure we're only using supported MIME types (JPEG or PNG)
      if (mimeType !== "image/jpeg" && mimeType !== "image/png") {
        mimeType = "image/jpeg" // Default to JPEG if not supported
      }
  
      // Convert base64 to Blob
      const byteCharacters = atob(base64Data)
      const byteArrays = []
  
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
  
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
  
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
  
      const blob = new Blob(byteArrays, { type: mimeType })
  
      // Create a FormData object
      const formData = new FormData()
      formData.append("image", blob, `plant-image.${mimeType === "image/png" ? "png" : "jpg"}`)
  
      // Send the request to our backend server instead of directly to PlantNet
      const response = await fetch("/api/identify-plant", {
        method: "POST",
        body: formData,
      })
  
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} ${errorText}`)
      }
  
      const data = await response.json()
  
      if (!data.results || data.results.length === 0) {
        throw new Error("No plants identified in the image")
      }
  
      // Get the top result
      const topResult = data.results[0]
  
      return {
        scientificName:
          `${topResult.species.scientificNameWithoutAuthor} ${topResult.species.scientificNameAuthorship}`.trim(),
        commonName:
          topResult.species.commonNames && topResult.species.commonNames.length > 0
            ? topResult.species.commonNames[0]
            : null,
        family: topResult.species.family.scientificNameWithoutAuthor,
        genus: topResult.species.genus.scientificNameWithoutAuthor,
        probability: Math.round(topResult.score * 100),
        matchCount: data.results.length,
        remainingRequests: data.remainingIdentificationRequests,
      }
    } catch (error) {
      console.error("Error identifying plant:", error)
      throw new Error(error.message || "Failed to identify plant")
    }
  }

  // Plant care tips database and logic
  function getPlantCareTips(plantType, scientificName = "", family = "") {
    // Expanded database of plant care tips by category
    const careTipsDatabase = {
      default: {
        category: "General",
        water: "Water when the top inch of soil is dry",
        light: "Medium to bright indirect light",
        temperature: "65-75°F (18-24°C)",
        soil: "Well-draining potting mix",
      },
      cactus: {
        category: "Cactus",
        water: "Water sparingly, only when soil is completely dry (every 2-4 weeks)",
        light: "Bright direct light for at least 6 hours daily",
        temperature: "70-100°F (21-38°C), can tolerate cooler temps in winter",
        soil: "Cactus/succulent mix with added perlite or sand",
      },
      succulent: {
        category: "Succulent",
        water: "Allow soil to dry completely between waterings (every 2-3 weeks)",
        light: "Bright direct to indirect light",
        temperature: "65-85°F (18-29°C)",
        soil: "Cactus/succulent mix with good drainage",
      },
      fern: {
        category: "Fern",
        water: "Keep soil consistently moist but not soggy",
        light: "Low to medium indirect light, avoid direct sun",
        temperature: "65-75°F (18-24°C) with high humidity",
        soil: "Rich, organic potting mix that retains moisture",
      },
      orchid: {
        category: "Orchid",
        water: "Water once a week, allowing to dry between waterings",
        light: "Bright indirect light, no direct sun",
        temperature: "65-80°F (18-27°C) with 50-70% humidity",
        soil: "Specialized orchid mix or bark",
      },
      palm: {
        category: "Palm",
        water: "Water when top 1-2 inches of soil is dry",
        light: "Bright indirect light",
        temperature: "65-85°F (18-29°C)",
        soil: "Well-draining palm soil mix",
      },
      aroid: {
        category: "Aroid",
        water: "Allow top inch of soil to dry between waterings",
        light: "Medium to bright indirect light",
        temperature: "65-85°F (18-29°C) with moderate humidity",
        soil: "Well-draining, airy potting mix with perlite",
      },
      herb: {
        category: "Herb",
        water: "Keep soil evenly moist",
        light: "At least 6 hours of direct sunlight daily",
        temperature: "65-75°F (18-24°C)",
        soil: "Well-draining potting mix",
      },
      vine: {
        category: "Vine",
        water: "Water when top inch of soil is dry",
        light: "Medium to bright indirect light",
        temperature: "65-80°F (18-27°C)",
        soil: "Rich, well-draining potting mix",
      },
      bromeliad: {
        category: "Bromeliad",
        water: "Fill central cup with water, allow soil to dry between waterings",
        light: "Bright indirect light",
        temperature: "65-80°F (18-27°C) with moderate humidity",
        soil: "Orchid mix or bromeliad-specific mix",
      },
      aquatic: {
        category: "Aquatic",
        water: "Keep fully or partially submerged in water",
        light: "Moderate to bright indirect light",
        temperature: "65-80°F (18-27°C)",
        soil: "Aquatic plant soil or no soil (water only)",
      },
    }

    // Plant family to category mapping
    const familyCategoryMap = {
      Cactaceae: "cactus",
      Asphodelaceae: "succulent",
      Crassulaceae: "succulent",
      Aizoaceae: "succulent",
      Polypodiaceae: "fern",
      Pteridaceae: "fern",
      Dryopteridaceae: "fern",
      Aspleniaceae: "fern",
      Orchidaceae: "orchid",
      Arecaceae: "palm",
      Araceae: "aroid",
      Marantaceae: "aroid",
      Lamiaceae: "herb",
      Apiaceae: "herb",
      Asteraceae: "herb",
      Apocynaceae: "vine",
      Bromeliaceae: "bromeliad",
      Nymphaeaceae: "aquatic",
    }

    // Genus to category mapping for common plants
    const genusCategoryMap = {
      // Cacti
      Mammillaria: "cactus",
      Opuntia: "cactus",
      Echinopsis: "cactus",
      Cereus: "cactus",

      // Succulents
      Aloe: "succulent",
      Haworthia: "succulent",
      Echeveria: "succulent",
      Sedum: "succulent",
      Sempervivum: "succulent",
      Crassula: "succulent",
      Kalanchoe: "succulent",
      Agave: "succulent",

      // Ferns
      Nephrolepis: "fern",
      Adiantum: "fern",
      Asplenium: "fern",
      Pteris: "fern",

      // Orchids
      Phalaenopsis: "orchid",
      Dendrobium: "orchid",
      Cattleya: "orchid",
      Oncidium: "orchid",

      // Palms
      Phoenix: "palm",
      Chamaedorea: "palm",
      Howea: "palm",
      Rhapis: "palm",

      // Aroids
      Monstera: "aroid",
      Philodendron: "aroid",
      Anthurium: "aroid",
      Alocasia: "aroid",
      Epipremnum: "aroid",
      Spathiphyllum: "aroid",
      Dieffenbachia: "aroid",
      Syngonium: "aroid",
      Aglaonema: "aroid",
      Zamioculcas: "aroid",

      // Herbs
      Ocimum: "herb",
      Mentha: "herb",
      Rosmarinus: "herb",
      Thymus: "herb",

      // Vines
      Hedera: "vine",
      Hoya: "vine",
      Cissus: "vine",

      // Bromeliads
      Guzmania: "bromeliad",
      Vriesea: "bromeliad",
      Tillandsia: "bromeliad",

      // Aquatic
      Nymphaea: "aquatic",
    }

    // Scientific name keywords for additional matching
    const scientificNameKeywords = {
      cactus: "cactus",
      succulent: "succulent",
      aloe: "succulent",
      fern: "fern",
      orchid: "orchid",
      palm: "palm",
      monstera: "aroid",
      philodendron: "aroid",
      pothos: "aroid",
      ivy: "vine",
      bromeliad: "bromeliad",
    }

    // Determine which care tips to show based on the plant information
    // Try multiple matching strategies in order of specificity
    let category = "default"
    const lowerScientificName = scientificName.toLowerCase()
    const lowerGenus = plantType.toLowerCase()

    // 1. Try to match by genus (most specific)
    if (genusCategoryMap[plantType]) {
      category = genusCategoryMap[plantType]
    }
    // 2. Try to match by family
    else if (family && familyCategoryMap[family]) {
      category = familyCategoryMap[family]
    }
    // 3. Try to match by keywords in scientific name
    else {
      for (const [keyword, cat] of Object.entries(scientificNameKeywords)) {
        if (lowerScientificName.includes(keyword) || lowerGenus.includes(keyword)) {
          category = cat
          break
        }
      }
    }

    return careTipsDatabase[category] || careTipsDatabase.default
  }
})
