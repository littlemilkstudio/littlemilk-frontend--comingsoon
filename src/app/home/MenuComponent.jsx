import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { value, physics, pointer } from 'popmotion'
import { MenuController, MenuItemInner } from './MenuPose'
import { stopActions } from '../../utils/actionHelpers'

class MenuComponent extends PureComponent {
  constructor (props) {
    super(props)

    this.list = React.createRef()
    this.index = React.createRef()
  }

  componentDidMount () {
    const { scrollToTransform, scrollPercent } = this.props

    // Initial values.
    this.values = {
      transformPercent: value(scrollPercent, scrollPercent => {
        // Update view
        const list = this.list.current
        const transform = scrollToTransform(scrollPercent)
        if (list && transform) {
          list.style.transform = `translate3d(0px, ${transform}%, 0px)`
        }

        // TODO: Update currentIndex value for view.
        const index = this.index.current
        if (index) {
          const currIndex = this.props.scrollPercentToIndex(scrollPercent)
          index.textContent = `00${currIndex + 1}.`
        }

        return scrollPercent
      })
    }

    /**
     * Needed to update transform of list initially.
     */
    this.values.transformPercent.update(scrollPercent)

    // Initial actions.
    this.actions = {
      physics: physics({
        from           : this.values.transformPercent.get(),
        friction       : 0.98,
        springStrength : 120,
        restSpeed      : false
      }).start(this.values.transformPercent),
      pointer: {}
    }
  }

  componentDidUpdate (prevProps) {
    const {
      isDragging,
      normalizedDragPipe,
      scrollPercent,
      stepsScrollPercent
    } = this.props

    // If start dragging setup pipes to pointer.
    if (prevProps.isDragging !== isDragging && isDragging) {
      this.actions.pointer = pointer({ y: 0 })
        .pipe(
          normalizedDragPipe,
          v => v + scrollPercent
        )
        .start(v => this.actions.physics.setSpringTarget(v))
    }

    // If stop dragging update store and clean up pointer.
    if (prevProps.isDragging !== isDragging && !isDragging) {
      // Update ScrollPercent
      const steppedScrollTotal = stepsScrollPercent(
        this.values.transformPercent.get()
      )
      this.props.updateScrollPercent(steppedScrollTotal)

      stopActions(this.actions.pointer)
    }

    if (!isDragging) {
      this.actions.physics.setSpringTarget(scrollPercent)
    }
  }

  componentWillUnmount () {
    stopActions(this.values)
    stopActions(this.actions)
  }

  render () {
    const { projects, isDragging } = this.props
    return (
      <MenuController pose={isDragging ? 'active' : 'inActive'}>
        <div className="h-menu">
          {'Height'}
          <ul ref={this.list} className="h-menu-list">
            {projects.map((project, i) => (
              <li key={project.title} className="h-menu-item">
                <div className="h-menu-title oh">
                  <MenuItemInner>{project.title}</MenuItemInner>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-menu-index oh">
          <MenuItemInner>
            <span ref={this.index}>001.</span>
          </MenuItemInner>
        </div>
      </MenuController>
    )
  }
}

MenuComponent.propTypes = {
  scrollPercent        : PropTypes.number.isRequired,
  scrollToTransform    : PropTypes.func.isRequired,
  isDragging           : PropTypes.bool.isRequired,
  projects             : PropTypes.arrayOf(PropTypes.object).isRequired,
  normalizedDragPipe   : PropTypes.func.isRequired,
  scrollPercentToIndex : PropTypes.func.isRequired,
  updateScrollPercent  : PropTypes.func.isRequired,
  stepsScrollPercent   : PropTypes.func.isRequired
}

export default MenuComponent
